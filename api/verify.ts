import { normalizeAnalysisText } from "../shared/textEncoding.js";
import { validateVerifyBody } from "../shared/validateInput.js";
import { getSupabaseClient } from "./_lib/supabase.js";
import { getErrorMessage, methodNotAllowed, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";
import { verifyText } from "../backend/services/verificationService.js";
import { judgeWithGemini } from "../backend/services/llmVerificationService.js";
import { withLlmCache } from "../backend/services/llmCache.js";
import { createSupabaseLlmCacheStore } from "./_lib/llmCacheStore.js";

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
    // Repeated claims reuse the stored Gemini verdict instead of spending free-tier quota.
    const cacheStore = createSupabaseLlmCacheStore();
    const llm = cacheStore ? withLlmCache(judgeWithGemini, cacheStore) : undefined;
    const { result: enrichedResult, providers } = await verifyText(normalizedText, { llm });

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
    } catch (error: unknown) {
      // Logging failure must not break the verification response, but we expose reason for debugging.
      storageError = getErrorMessage(error, "verification_log_insert_failed");
      console.error("[verify] storage error:", storageError);
    }

    sendJson(res, 200, storageError ? { ...responsePayload, storageError } : responsePayload);
  } catch (error: unknown) {
    sendJson(res, 500, { error: getErrorMessage(error, "verification_failed") });
  }
}
