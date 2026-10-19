import { analyzeContent, type AnalysisResult } from "./analyzer";

/**
 * Prioriza verificación serverless (/api/verify) y usa fallback local
 * cuando el backend no está disponible.
 */
export async function verifyContent(text: string, kind: "text" | "url" = "text"): Promise<AnalysisResult> {
  try {
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, kind }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload?.error ?? "verification_failed";
      throw new Error(message);
    }

    const payload = (await response.json()) as AnalysisResult;
    return {
      ...payload,
      timestamp: new Date(payload.timestamp),
      inputText: payload.inputText ?? text,
      inputKind: payload.inputKind ?? kind,
    };
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result = analyzeContent(text);
    return {
      ...result,
      inputKind: kind,
      engine: "local",
      analysisOrigin: "Análisis textual local",
      preliminaryLocal: true,
      sources: [],
      timestamp: new Date(),
    };
  }
}

