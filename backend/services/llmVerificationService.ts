import type { VerifiedSource } from "../../shared/analyzer.js";

export type LlmClassification = "confiable" | "dudoso" | "falso";

export interface LlmVerdict {
  classification: LlmClassification;
  reason: string;
}

export type LlmJudge = (claim: string, sources: VerifiedSource[]) => Promise<LlmVerdict | null>;

const DEFAULT_MODEL = "gemini-flash-latest";
const TIMEOUT_MS = 12000;

const INSTRUCTIONS = `Eres un verificador de noticias riguroso. Recibes una afirmación y fuentes encontradas en internet.
Clasifica la afirmación en una de tres categorías:
- "falso": contradice evidencia o conocimiento científico establecido, es una estafa/phishing, una teoría conspirativa o una promesa imposible, o las fuentes la desmienten.
- "confiable": está respaldada por fuentes oficiales o evidencia sólida y verificable.
- "dudoso": no hay evidencia suficiente para confirmarla ni desmentirla, es un rumor, una atribución vaga o está exagerada o sin contexto.
Reglas: sé prudente. Ante la duda entre "confiable" y "dudoso", elige "dudoso". Nunca marques "confiable" sin respaldo claro.
Usa tu conocimiento del mundo y las fuentes. Las fuentes pueden ser irrelevantes o ruidosas: ignóralas si no tratan el tema.
Responde SOLO con JSON: {"classification":"falso|confiable|dudoso","reason":"explicación breve en español (máx. 2 frases)"}`;

function buildPrompt(claim: string, sources: VerifiedSource[]): string {
  const evidence = sources
    .slice(0, 6)
    .map((s, i) => `${i + 1}. [${s.publisher ?? "fuente"}] ${s.title ?? ""} — ${(s.snippet ?? "").slice(0, 280)}`)
    .join("\n");
  return `${INSTRUCTIONS}\n\nAFIRMACIÓN:\n${claim}\n\nFUENTES:\n${evidence || "(sin fuentes)"}`;
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

/** Gemini judge. Returns null when the key is missing, the call fails or the answer is not valid. */
export const judgeWithGemini: LlmJudge = async (claim, sources) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(claim, sources) }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return parseVerdict(text);
  } catch {
    return null;
  }
};
