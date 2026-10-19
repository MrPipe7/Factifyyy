import { analyzeContent } from "../shared/analyzer.js";
import { validateVerifyBody } from "../shared/validateInput.js";
import { getSupabaseClient } from "./_lib/supabase.js";
import { methodNotAllowed, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";

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

    const result = analyzeContent(validated.text);
    const providers = [
      process.env.GOOGLE_FACT_CHECK_API_KEY ? "google_fact_check" : null,
      process.env.TAVILY_API_KEY ? "tavily" : null,
    ].filter(Boolean) as string[];

    const responsePayload = {
      ...result,
      inputKind: validated.kind,
      processingMs: Date.now() - startedAt,
      providers,
    };

    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("verifications_log")
        .insert({
        input_text: validated.text,
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

      if (data?.id) {
        responsePayload.verificationId = data.id;
      }
    } catch {
      // Logging failure must not break the verification response.
    }

    sendJson(res, 200, responsePayload);
  } catch (error: any) {
    sendJson(res, 500, { error: error?.message ?? "verification_failed" });
  }
}
