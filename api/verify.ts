import { analyzeContent } from "../shared/analyzer.js";
import { normalizeAnalysisText } from "../shared/textEncoding.js";
import { validateVerifyBody } from "../shared/validateInput.js";
import { getSupabaseClient } from "./_lib/supabase.js";
import { methodNotAllowed, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";
import { runFactCheck } from "../backend/services/factCheckService.js";
import type { VerifiedSource } from "../shared/analyzer.js";

function countAlerts(result: ReturnType<typeof analyzeContent>): number {
  return result.signals.filter((s) => s.type === "negative" || s.type === "warning").length;
}

function classifyByLocalContingency(alerts: number): "confiable" | "dudoso" | "falso" {
  if (alerts === 0) return "confiable";
  if (alerts <= 2) return "dudoso";
  return "falso";
}

function classifyBySources(
  support: number,
  contradict: number,
  totalSources: number,
): "confiable" | "dudoso" | "falso" {
  // API-first rules:
  // - Confiable/Falso dependen del balance de fuentes externas.
  // - Dudoso queda como estado intermedio cuando la evidencia no es concluyente.
  if (totalSources >= 2 && support >= contradict + 2) return "confiable";
  if (totalSources >= 2 && contradict >= support + 2) return "falso";
  return "dudoso";
}

function sourceDensityInText(text: string): number {
  const urlCount = (text.match(/https?:\/\/[^\s]+/gi) ?? []).length;
  const mentionCount = (text.match(/\b(reuters|bbc|cnn|ap\b|afp|ministerio|oms|who|universidad|instituto)\b/gi) ?? []).length;
  return urlCount + mentionCount;
}

function confidenceByLocalSignals(
  classification: "confiable" | "dudoso" | "falso",
  alerts: number,
  sourceDensity: number,
): number {
  if (classification === "confiable") {
    return Math.min(88, 72 + Math.min(12, sourceDensity * 4));
  }
  if (classification === "dudoso") {
    return Math.min(78, 58 + Math.min(8, sourceDensity * 2) + Math.max(0, 3 - alerts) * 3);
  }
  return Math.min(94, 74 + alerts * 4 - Math.min(8, sourceDensity * 2));
}

function confidenceByExternalSources(
  claimReviewMatches: number,
  contradictions: number,
  totalSources: number,
  _localAlerts: number,
): number {
  const score =
    58 +
    claimReviewMatches * 11 +
    Math.min(16, Math.max(0, totalSources - claimReviewMatches) * 3) -
    contradictions * 11;
  return Math.max(40, Math.min(97, score));
}

function buildSourceBasedExplanation(
  classification: "confiable" | "dudoso" | "falso",
  _support: number,
  _contradict: number,
  _neutral: number,
  _total: number,
  claimText: string,
): string {
  const claim = summarizeClaimForUser(claimText);
  if (classification === "confiable") {
    return `Sobre ${claim}, la evidencia externa apunta a que es confiable: hay más respaldo que desmentidos y no se observan contradicciones fuertes en fuentes verificables.`;
  }
  if (classification === "falso") {
    return `Sobre ${claim}, la evidencia externa apunta a que es falsa: predominan desmentidos o contradicciones directas en las fuentes consultadas.`;
  }
  return `Sobre ${claim}, la evidencia externa es insuficiente para confirmarla o desmentirla con seguridad: aparecen señales mixtas y sin consenso claro.`;
}

function buildSourceBasedRecommendation(
  classification: "confiable" | "dudoso" | "falso",
): string {
  if (classification === "confiable") {
    return "La afirmación analizada presenta respaldo externo mayoritario. Aun así, revisa al menos una fuente oficial original antes de compartir.";
  }
  if (classification === "falso") {
    return "La afirmación analizada presenta contradicciones relevantes en fuentes externas. Evita compartir hasta confirmar en verificadores y medios oficiales.";
  }
  return "La evidencia externa es intermedia o insuficiente. Revisa más referencias independientes antes de compartir.";
}

function publisherQualityScore(source: VerifiedSource): number {
  const publisher = (source.publisher ?? "").toLowerCase();
  const url = (source.url ?? "").toLowerCase();
  const trustedPattern =
    /(reuters|bbc|apnews|afp|factcheck|snopes|politifact|who\.int|\.gov|\.gob|\.edu|chequeado|maldita|newtral)/;
  return trustedPattern.test(`${publisher} ${url}`) ? 2 : 0;
}

function normalizeForMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isLowQualitySourceForSummary(source: VerifiedSource): boolean {
  const url = (source.url ?? "").toLowerCase();
  const publisher = (source.publisher ?? "").toLowerCase();
  const socialOrUGC =
    /(youtube\.com|youtu\.be|facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com|reddit\.com)/.test(
      `${url} ${publisher}`,
    );
  if (socialOrUGC) return true;

  const snippet = (source.snippet ?? "").trim();
  if (!snippet) return true;
  const upperRatio =
    snippet.length > 0
      ? (snippet.match(/[A-ZÁÉÍÓÚÑ]/g)?.length ?? 0) / Math.max(1, (snippet.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/g)?.length ?? 1))
      : 0;
  const noisySnippet = /[#]{1,}|!{2,}|suscrib|canal|viral|gana|sorteo/i.test(snippet) || upperRatio > 0.45;
  return noisySnippet;
}

function themeHits(sources: VerifiedSource[], stance: "support" | "contradict" | "neutral", patterns: RegExp[]): number {
  return sources
    .filter((s) => s.stance === stance)
    .reduce((acc, s) => {
      const text = normalizeForMatch(`${s.title ?? ""} ${s.snippet ?? ""}`);
      const hit = patterns.some((re) => re.test(text));
      return acc + (hit ? 1 : 0);
    }, 0);
}

function summarizeClaimForUser(input: string): string {
  const clean = input.replace(/\s+/g, " ").trim();
  if (!clean) return "la solicitud analizada";
  const snippet = clean.length > 120 ? `${clean.slice(0, 117).trimEnd()}...` : clean;
  return `la solicitud "${snippet}"`;
}

function formatCountWithLabel(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function buildEvidenceMiniSummary(
  sources: VerifiedSource[],
  classification: "confiable" | "dudoso" | "falso",
  claimText: string,
): string {
  if (!sources.length) return "";
  const prioritized = sources
    .filter((s) => !isLowQualitySourceForSummary(s))
    .sort((a, b) => {
      const weight = (s: VerifiedSource) =>
        (s.stance === "support" ? 2 : s.stance === "contradict" ? 1 : 0) + publisherQualityScore(s);
      return weight(b) - weight(a);
    })
    .slice(0, 2);

  // Keep explanation consistent with what the user sees in source stats:
  // balance always uses the full visible source set.
  const supportTotal = sources.filter((s) => s.stance === "support").length;
  const contradictTotal = sources.filter((s) => s.stance === "contradict").length;
  const neutralTotal = sources.filter((s) => s.stance === "neutral" || !s.stance).length;
  const trustedTotal = sources.filter((s) => publisherQualityScore(s) > 0).length;

  // Thematic cues can use cleaner subset when available.
  const thematicPool = prioritized.length ? prioritized : sources;

  const noEvidenceHits = themeHits(thematicPool, "contradict", [
    /(no hay evidencia|sin evidencia|falso|bulo|desmiente|engaños|misleading|fake)/,
  ]);
  const confirmationHits = themeHits(thematicPool, "support", [
    /(verificado|confirmado|oficial|evidencia|accurate|correcto|fact check true)/,
  ]);
  const uncertaintyHits = themeHits(thematicPool, "neutral", [
    /(podria|podría|sin confirmar|version preliminar|rumor|no concluyente)/,
  ]);

  const balance = `Balance observado en fuentes de contraste: ${formatCountWithLabel(supportTotal, "fuente", "fuentes")} a favor, ${contradictTotal} en contra y ${neutralTotal} neutrales; ${trustedTotal} provienen de verificadores o medios de alta confianza.`;

  if (classification === "falso") {
    const reason =
      noEvidenceHits > 0
        ? "Las fuentes revisadas describen desmentidos o ausencia de evidencia sólida para sostener la afirmación."
        : "Las fuentes revisadas no respaldan la afirmación y aparecen contradicciones directas.";
    return `${reason} ${balance}`;
  }

  if (classification === "confiable") {
    const reason =
      confirmationHits > 0 || noEvidenceHits > 0
        ? "Las fuentes revisadas muestran señales de verificación o corrección del bulo asociado."
        : "Las fuentes revisadas sostienen la afirmación y no muestran desmentidos dominantes.";
    return `${reason} ${balance}`;
  }

  const reason =
    uncertaintyHits > 0 || neutralTotal >= supportTotal + contradictTotal
      ? "Las fuentes revisadas hablan del tema sin confirmación oficial concluyente."
      : "Las fuentes revisadas se reparten entre posturas distintas y no permiten una conclusión firme.";
  return `${reason} ${balance}`;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  const startedAt = Date.now();
  try {
    const body = await readJsonBody(req);
    const validated = validateVerifyBody(body);
    if ("error" in validated) {
      sendJson(res, validated.status, { error: validated.error });
      return;
    }

    const normalizedText = normalizeAnalysisText(validated.text);
    const localResult = analyzeContent(normalizedText);
    const localAlerts = countAlerts(localResult);
    const localSourceDensity = sourceDensityInText(normalizedText);

    let enrichedResult = { ...localResult };
    let providers: string[] = [];
    const factCheckResult = await runFactCheck(normalizedText);
    if (factCheckResult) {
      providers = factCheckResult.providers;
      const hasExternal = factCheckResult.sources.length > 0;
      const contradictions = factCheckResult.claimReviewContradictions;
      const sourceSupport = factCheckResult.sources.filter((s) => s.stance === "support").length;
      const sourceContradict = factCheckResult.sources.filter((s) => s.stance === "contradict").length;
      const sourceNeutral = factCheckResult.sources.filter((s) => s.stance === "neutral" || !s.stance).length;
      const hasLocalDebunkSignal = localResult.signals.some(
        (s) => s.label === "Redacción de desmentido explícito",
      );
      const sourceDrivenClassification = classifyBySources(
        sourceSupport,
        sourceContradict,
        factCheckResult.sources.length,
      );
      const strongExternalContradiction =
        sourceContradict >= 2 && sourceContradict >= sourceSupport + 1;
      const hasOfficialCoincidences = factCheckResult.claimReviewMatches >= 2;

      if (hasOfficialCoincidences) {
        const baseExplanation =
          "Se detectaron dos o más coincidencias en agencias de verificación (ClaimReview), lo que respalda la credibilidad del contenido.";
        enrichedResult = {
          ...localResult,
          classification: "confiable",
          confidence: confidenceByExternalSources(
            factCheckResult.claimReviewMatches,
            contradictions,
            factCheckResult.sources.length,
            localAlerts,
          ),
          explanation: `${baseExplanation} ${buildEvidenceMiniSummary(factCheckResult.sources, "confiable", normalizedText)}`.trim(),
          recommendation:
            "La afirmación analizada presenta respaldo en verificadores externos confiables. Revisa igualmente las fuentes originales para mayor contexto.",
          engine: "factcheck",
          analysisOrigin: "Verificación externa encontrada",
          preliminaryLocal: false,
          sources: factCheckResult.sources,
          sourceStats: {
            support: sourceSupport,
            contradict: sourceContradict,
            neutral: sourceNeutral,
            irrelevant: 0,
            total: factCheckResult.sources.length,
          },
        };
      } else if (!hasExternal) {
        const contingencyClassification = hasLocalDebunkSignal
          ? "confiable"
          : classifyByLocalContingency(localAlerts);
        enrichedResult = {
          ...localResult,
          classification: contingencyClassification,
          confidence: confidenceByLocalSignals(contingencyClassification, localAlerts, localSourceDensity),
          explanation:
            hasLocalDebunkSignal
              ? "Se consultaron las APIs externas, pero no devolvieron coincidencias útiles para este caso. Como el texto es un desmentido explícito y no hay contradicción externa, se clasifica como confiable."
              : "Se consultaron las APIs externas, pero no devolvieron coincidencias útiles para esta solicitud. La clasificación se resolvió con señales del contenido ingresado.",
          recommendation:
            contingencyClassification === "confiable"
              ? "El contenido no mostró alertas locales. Aun así, contrasta en al menos una fuente oficial."
              : "Se recomienda contrastar esta afirmación con verificadores y medios oficiales antes de compartirla.",
          engine: "factcheck",
          analysisOrigin: "Sin verificación externa disponible",
          preliminaryLocal: true,
          sources: [],
          sourceStats: { support: 0, contradict: 0, neutral: 0, irrelevant: 0, total: 0 },
        };
      } else {
        const effectiveClassification =
          hasLocalDebunkSignal && !strongExternalContradiction
            ? "confiable"
            : sourceDrivenClassification;
        const usedDebunkOverride =
          effectiveClassification === "confiable" &&
          sourceDrivenClassification !== "confiable" &&
          hasLocalDebunkSignal;

        const bySourcesConfidence = confidenceByExternalSources(
          sourceSupport,
          sourceContradict,
          factCheckResult.sources.length,
          localAlerts,
        );

        const baseExplanation = usedDebunkOverride
          ? `Se encontraron ${factCheckResult.sources.length} fuentes de contraste (${sourceSupport} a favor, ${sourceContradict} en contra y ${sourceNeutral} neutrales). Como el texto es un desmentido explícito y no hubo contradicción externa dominante, se clasifica como confiable.`
          : buildSourceBasedExplanation(
              effectiveClassification,
              sourceSupport,
              sourceContradict,
              sourceNeutral,
              factCheckResult.sources.length,
              normalizedText,
            );

        enrichedResult = {
          ...localResult,
          // API-first: external sources drive final verdict when available.
          classification: effectiveClassification,
          confidence:
            effectiveClassification === "confiable" && hasLocalDebunkSignal
              ? Math.max(74, bySourcesConfidence)
              : bySourcesConfidence,
          explanation: `${baseExplanation} ${buildEvidenceMiniSummary(factCheckResult.sources, effectiveClassification, normalizedText)}`.trim(),
          recommendation: buildSourceBasedRecommendation(effectiveClassification),
          engine: "factcheck",
          analysisOrigin: "Análisis textual + verificación externa",
          preliminaryLocal: false,
          sources: factCheckResult.sources,
          sourceStats: {
            support: sourceSupport,
            contradict: sourceContradict,
            neutral: sourceNeutral,
            irrelevant: 0,
            total: factCheckResult.sources.length,
          },
        };
      }
    }

    const responsePayload = {
      ...enrichedResult,
      inputKind: validated.kind,
      processingMs: Date.now() - startedAt,
      providers,
    };

    let storageError: string | null = null;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("verifications_log")
        .insert({
        input_text: normalizedText,
        input_kind: validated.kind,
        classification: responsePayload.classification,
        confidence: responsePayload.confidence,
        engine: responsePayload.engine ?? "local",
        analysis_origin: responsePayload.analysisOrigin ?? "Análisis textual local",
        processing_ms: responsePayload.processingMs,
        providers,
        result_json: responsePayload,
        })
        .select("id")
        .single();

      if (error) {
        storageError = error.message;
      }

      if (data?.id) {
        responsePayload.verificationId = data.id;
      }
    } catch (error: any) {
      // Logging failure must not break the verification response, but we expose reason for debugging.
      storageError = error?.message ?? "verification_log_insert_failed";
      console.error("[verify] storage error:", storageError);
    }

    if (storageError) {
      (responsePayload as any).storageError = storageError;
    }

    sendJson(res, 200, responsePayload);
  } catch (error: any) {
    sendJson(res, 500, { error: error?.message ?? "verification_failed" });
  }
}
