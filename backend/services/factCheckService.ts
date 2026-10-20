import type { VerifiedSource } from "../../shared/analyzer.js";

export interface FactCheckResult {
  sources: VerifiedSource[];
  providers: string[];
  claimReviewMatches: number;
  claimReviewContradictions: number;
}

function isDebunkFramedClaim(text: string): boolean {
  const norm = normalizeText(text);
  return [
    "es falso que",
    "no es cierto que",
    "es incorrecto que",
    "es un mito que",
    "no hay evidencia de que",
    "esta desmentido que",
    "esta desmentida la afirmacion",
  ].some((p) => norm.includes(p));
}

async function withSingleRetry<T>(task: () => Promise<T>): Promise<T> {
  try {
    return await task();
  } catch {
    return await task();
  }
}

function adjustStanceByClaimFrame(
  stance: "support" | "contradict" | "neutral",
  isDebunkClaim: boolean,
): "support" | "contradict" | "neutral" {
  if (!isDebunkClaim) return stance;
  if (stance === "support") return "contradict";
  if (stance === "contradict") return "support";
  return stance;
}

function normalizePublisher(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "fuente externa";
  }
}

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractQueryTerms(text: string): string[] {
  const stop = new Set([
    "el", "la", "los", "las", "de", "del", "y", "o", "u", "en", "por", "para", "con", "sin",
    "que", "un", "una", "unos", "unas", "es", "son", "fue", "fueron", "ha", "han", "se", "al",
    "lo", "le", "les", "a", "como", "sobre", "desde",
  ]);
  const words = normalizeText(text)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
  return Array.from(new Set(words)).slice(0, 10);
}

function relevanceScore(haystack: string, terms: string[]): number {
  const h = normalizeText(haystack);
  let score = 0;
  for (const t of terms) {
    if (h.includes(t)) score += 1;
  }
  return score;
}

function mapGoogleClaimReviewToSources(payload: any, isDebunkClaim: boolean): VerifiedSource[] {
  const claims = Array.isArray(payload?.claims) ? payload.claims : [];
  const out: VerifiedSource[] = [];

  for (const claim of claims) {
    const reviews = Array.isArray(claim?.claimReview) ? claim.claimReview : [];
    for (const review of reviews) {
      const url = typeof review?.url === "string" ? review.url : "";
      if (!url) continue;
      const rating = typeof review?.textualRating === "string" ? review.textualRating.toLowerCase() : "";
      const baseStance: "support" | "contradict" | "neutral" =
        /false|falso|incorrect|engaños|misleading|fake/.test(rating)
          ? "contradict"
          : "support";
      const stance = adjustStanceByClaimFrame(baseStance, isDebunkClaim);

      out.push({
        title: typeof claim?.text === "string" ? claim.text : "Revision de verificacion externa",
        url,
        snippet: typeof review?.textualRating === "string" ? review.textualRating : undefined,
        publisher: typeof review?.publisher?.name === "string" ? review.publisher.name : normalizePublisher(url),
        stance,
      });
    }
  }

  return out;
}

function mapTavilyToSources(payload: any, isDebunkClaim: boolean): VerifiedSource[] {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const inferStance = (text: string): "support" | "contradict" | "neutral" => {
    const t = text.toLowerCase();
    if (/(falso|fake|hoax|desmiente|engaños|misleading|fabricad|ia generado|ai generated)/.test(t)) {
      return "contradict";
    }
    if (/(verificado|confirmado|oficial|evidencia|comunicado oficial|true|accurate|fact check true|correcto)/.test(t)) {
      return "support";
    }
    return "neutral";
  };

  return results.slice(0, 5).map((r: any) => {
    const url = typeof r?.url === "string" ? r.url : "";
    const title = typeof r?.title === "string" ? r.title : "Fuente encontrada";
    const content = typeof r?.content === "string" ? r.content : "";
    const domain = normalizePublisher(url);
    const isTrustedDomain =
      /(reuters\.com|bbc\.com|apnews\.com|afp\.com|factcheck\.org|snopes\.com|politifact\.com|who\.int|gov|gob\.|edu)/.test(domain);
    const inferred = inferStance(`${title} ${content}`);
    const baseStance = inferred === "neutral" && isTrustedDomain ? "support" : inferred;
    const stance = adjustStanceByClaimFrame(baseStance, isDebunkClaim);
    return {
      title,
      url,
      snippet: content ? content.slice(0, 220) : undefined,
      publisher: normalizePublisher(url),
      stance,
    };
  }).filter((x: VerifiedSource) => Boolean(x.url));
}

async function queryGoogleFactCheck(text: string, apiKey: string): Promise<VerifiedSource[]> {
  const endpoint = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(text)}&languageCode=es&key=${apiKey}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`google_fact_check_${response.status}`);
  const payload = await response.json();
  return mapGoogleClaimReviewToSources(payload, isDebunkFramedClaim(text));
}

async function queryTavily(text: string, apiKey: string): Promise<VerifiedSource[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: text,
      search_depth: "basic",
      max_results: 5,
    }),
  });
  if (!response.ok) throw new Error(`tavily_${response.status}`);
  const payload = await response.json();
  return mapTavilyToSources(payload, isDebunkFramedClaim(text));
}

function buildRelaxedQuery(text: string): string {
  const terms = extractQueryTerms(text);
  if (!terms.length) return text;
  return terms.slice(0, 6).join(" ");
}

export async function runFactCheck(text: string): Promise<FactCheckResult> {
  const googleKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  const providers: string[] = [];
  const allSources: VerifiedSource[] = [];
  let claimReviewMatches = 0;
  let claimReviewContradictions = 0;

  const terms = extractQueryTerms(text);
  const relaxedQuery = buildRelaxedQuery(text);
  const [googleSourcesRaw, tavilySourcesRaw] = await Promise.all([
    googleKey ? withSingleRetry(() => queryGoogleFactCheck(text, googleKey)).catch(() => []) : Promise.resolve([]),
    tavilyKey ? withSingleRetry(() => queryTavily(text, tavilyKey)).catch(() => []) : Promise.resolve([]),
  ]);
  const tavilyRelaxed =
    tavilyKey && tavilySourcesRaw.length === 0 && relaxedQuery !== text
      ? await withSingleRetry(() => queryTavily(relaxedQuery, tavilyKey)).catch(() => [])
      : [];
  const mergedTavilyRaw = [...tavilySourcesRaw, ...tavilyRelaxed];

  const googleSources = googleSourcesRaw.filter((s) => {
    const combined = `${s.title} ${s.snippet ?? ""} ${s.publisher ?? ""}`;
    return relevanceScore(combined, terms) >= 1;
  });
  let tavilySources = mergedTavilyRaw.filter((s) => {
    const combined = `${s.title} ${s.snippet ?? ""} ${s.publisher ?? ""}`;
    return relevanceScore(combined, terms) >= 1;
  });
  if (tavilySources.length === 0) {
    tavilySources = mergedTavilyRaw.slice(0, 3);
  }

  if (googleKey) providers.push("google_fact_check");
  if (tavilyKey) providers.push("tavily");

  claimReviewMatches = googleSources.filter((s) => s.stance === "support").length;
  claimReviewContradictions = googleSources.filter((s) => s.stance === "contradict").length;
  allSources.push(...googleSources, ...tavilySources);

  const deduped = allSources.filter((item, idx, arr) => arr.findIndex((x) => x.url === item.url) === idx);
  return {
    sources: deduped,
    providers,
    claimReviewMatches,
    claimReviewContradictions,
  };
}
