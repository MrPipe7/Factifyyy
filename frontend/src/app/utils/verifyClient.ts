import { analyzeContent, type AnalysisResult } from "./analyzer";

/**
 * Motor de análisis local basado en reglas lingüísticas y baseline NLP.
 * Ejecuta la verificación directamente en el cliente/servidor local sin dependencias externas.
 */
export async function verifyContent(text: string): Promise<AnalysisResult> {
  // Pequeña simulación de procesamiento NLP para UX
  await new Promise((resolve) => setTimeout(resolve, 350));

  const result = analyzeContent(text);
  return {
    ...result,
    inputKind: "text",
    engine: "local",
    analysisOrigin: "Análisis textual local",
    preliminaryLocal: true,
    sources: [],
    timestamp: new Date(),
  };
}

