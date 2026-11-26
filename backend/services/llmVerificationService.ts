import type { VerifiedSource } from "../../shared/analyzer.js";

export type LlmClassification = "confiable" | "dudoso" | "falso";

export interface LlmVerdict {
  classification: LlmClassification;
  reason: string;
}

export type LlmJudge = (claim: string, sources: VerifiedSource[]) => Promise<LlmVerdict | null>;

/** Bump when the prompt changes so cached verdicts from an older prompt are not reused. */
export const PROMPT_VERSION = "v3";

/** Per-request timeout and total budget for one verdict (all models and retries together). */
const TIMEOUT_MS = 8000;
const TOTAL_BUDGET_MS = 18000;

const INSTRUCTIONS = `Eres un verificador de noticias riguroso. Recibes una afirmación y fuentes encontradas en internet.
Clasifícala en una de tres categorías:

- "falso": existe evidencia o conocimiento establecido de que es falsa. Incluye bulos ya desmentidos, afirmaciones contrarias al consenso científico, teorías conspirativas refutadas, estafas o phishing (premios, enlaces para "recuperar" cuentas, pagos por adelantado) y promesas imposibles (curas milagrosas).
- "confiable": es un hecho o suceso verificable, bien documentado, o está respaldado por fuentes oficiales o evidencia sólida. Usa tu conocimiento del mundo: un acontecimiento histórico o reciente muy conocido y bien documentado es confiable aunque las fuentes de búsqueda sean pobres.
- "dudoso": no se puede confirmar ni desmentir. Rumores, fuentes anónimas ("según fuentes cercanas"), atribuciones vagas ("dicen que", "se asegura", "supuesto", "presunto"), contenido viral sin contexto, estudios sin publicar, promesas exageradas sin pruebas, cifras sin fuente.

Regla clave: la FALTA de pruebas no convierte algo en "falso". Marca "falso" solo si hay evidencia o conocimiento sólido de que es falso, o si es una estafa o algo imposible. Si simplemente no hay manera de comprobarlo, es "dudoso".
Ante la duda entre "confiable" y "dudoso", elige "dudoso". Ante la duda entre "falso" y "dudoso" por falta de evidencia, elige "dudoso".

Ejemplos (no relacionados con lo que vas a analizar):
- "El Titanic se hundió en 1912 tras chocar con un iceberg" -> confiable
- "Tomar agua con limón en ayunas cura la diabetes" -> falso
- "Pulsa este enlace para recuperar tu cuenta bancaria bloqueada y confirma tu clave" -> falso
- "Aseguran que una actriz se casó en secreto, aunque su agente no lo confirma" -> dudoso
- "Un presunto documento filtrado indicaría que subirán los impuestos" -> dudoso
- "Un estudio todavía no publicado afirma que el chocolate mejora la memoria" -> dudoso

Tu conocimiento puede estar desactualizado: cargos políticos, resultados de elecciones y hechos recientes pueden haber cambiado. Nunca marques "falso" una afirmación solo porque contradice lo que recuerdas sobre quién ocupa un cargo o sobre acontecimientos recientes. Si las fuentes recientes la respaldan, es "confiable"; si no hay fuentes que la confirmen ni desmientan, es "dudoso".

Las fuentes pueden ser irrelevantes o ruidosas: ignóralas si no tratan el tema. Un artículo que desmiente la afirmación NO la respalda.
Responde SOLO con JSON: {"classification":"falso|confiable|dudoso","reason":"explicación breve en español (máx. 2 frases)"}`;

function buildPrompt(claim: string, sources: VerifiedSource[]): string {
  const evidence = sources
    .slice(0, 6)
    .map((s, i) => `${i + 1}. [${s.publisher ?? "fuente"}] ${s.title ?? ""} — ${(s.snippet ?? "").slice(0, 280)}`)
    .join("\n");
  const today = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Santiago" });
  return `${INSTRUCTIONS}\n\nFECHA DE HOY: ${today}. Las fuentes son más recientes que tu entrenamiento: si ellas contradicen lo que recuerdas, las fuentes tienen prioridad.\n\nAFIRMACIÓN:\n${claim}\n\nFUENTES:\n${evidence || "(sin fuentes)"}`;
}

function parseVerdict(text: string): LlmVerdict | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const data = JSON.parse(cleaned) as { classification?: unknown; reason?: unknown };
    const c = typeof data.classification === "string" ? data.classification.toLowerCase().trim() : "";
    if (c !== "falso" && c !== "confiable" && c !== "dudoso") return null;
    return { classification: c, reason: typeof data.reason === "string" ? data.reason.trim() : "" };
  } catch {
    return null;
  }
}

/** Free-tier models in fallback order. Each model has its own daily quota, so when one is exhausted the next one is used. */
const MODEL_CHAIN = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3-flash-preview")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const COOLDOWN_MS = 60 * 60 * 1000;
const SHORT_COOLDOWN_MS = 30 * 1000;
const unavailableUntil = new Map<string, number>();
const rejectsThinkingConfig = new Set<string>();

let queue: Promise<void> = Promise.resolve();
let lastCallAt = 0;
let minIntervalMs = Number(process.env.GEMINI_MIN_INTERVAL_MS ?? 0);

/** Spaces consecutive Gemini calls. Only needed for long batches (evaluation); the app answers one request at a time. */
export function setLlmMinInterval(ms: number): void {
  minIntervalMs = ms;
}

/** Gemini judge. Returns null when the key is missing, every model fails or the answer is not valid. */
export const judgeWithGemini: LlmJudge = (claim, sources) => {
  const run = queue.then(async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const wait = lastCallAt + minIntervalMs - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    // Total time budget: a slow or overloaded Gemini must not make the user wait; the caller falls back to rules + sources.
    const deadline = Date.now() + TOTAL_BUDGET_MS;
    try {
      for (const model of MODEL_CHAIN) {
        if ((unavailableUntil.get(model) ?? 0) > Date.now()) continue;
        if (Date.now() >= deadline) break;
        let outcome = await callGemini(apiKey, model, claim, sources);
        // Overloaded servers (5xx) and timeouts are transient: retry once before moving on, without blocking the model.
        const transient = (s?: number) => s === undefined || s >= 500;
        if (!outcome.ok && transient(outcome.status) && Date.now() < deadline - 3000) {
          await new Promise((r) => setTimeout(r, 1500));
          outcome = await callGemini(apiKey, model, claim, sources);
        }
        if (outcome.ok) return outcome.verdict;
        if (transient(outcome.status)) continue;
        // Daily quota (or an unusable model/config): skip it for an hour. Per-minute limit: only 30 seconds.
        unavailableUntil.set(model, Date.now() + (outcome.status === 429 && !outcome.dailyQuotaExhausted ? SHORT_COOLDOWN_MS : COOLDOWN_MS));
      }
      return null;
    } finally {
      lastCallAt = Date.now();
    }
  });
  queue = run.then(() => undefined, () => undefined);
  return run;
};

async function callGemini(
  apiKey: string,
  model: string,
  claim: string,
  sources: VerifiedSource[],
): Promise<{ ok: boolean; verdict: LlmVerdict | null; status?: number; dailyQuotaExhausted?: boolean }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(claim, sources) }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          // Some models reject an explicit thinking budget: they are remembered and called without it.
          ...(rejectsThinkingConfig.has(model) ? {} : { thinkingConfig: { thinkingBudget: 0 } }),
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      if (process.env.FACTIFY_DEBUG_LLM) console.error(`[llm] ${model} HTTP ${response.status}`);
      const errorBody = await response.text().catch(() => "");
      if (response.status === 400 && !rejectsThinkingConfig.has(model)) {
        rejectsThinkingConfig.add(model);
        return callGemini(apiKey, model, claim, sources);
      }
      const dailyQuotaExhausted = response.status === 429 && /per ?day|PerDay/i.test(errorBody);
      return { ok: false, verdict: null, status: response.status, dailyQuotaExhausted };
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (process.env.FACTIFY_DEBUG_LLM) console.error(`[llm] ${model} ok`);
    return { ok: true, verdict: parseVerdict(text) };
  } catch {
    return { ok: false, verdict: null };
  }
}
