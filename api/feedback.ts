import { getSupabaseClient } from "./_lib/supabase.js";
import { methodNotAllowed, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = (await readJsonBody(req)) as Record<string, unknown>;
    const verificationId = typeof body.verificationId === "string" ? body.verificationId : null;
    const vote = body.vote === "helpful" || body.vote === "not_helpful" ? body.vote : null;
    const comment = typeof body.comment === "string" ? body.comment.trim() : null;

    if (!verificationId || !vote) {
      sendJson(res, 400, { error: "verificationId y vote son obligatorios." });
      return;
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase.from("user_feedback").insert({
      verification_id: verificationId,
      vote,
      comment: comment || null,
    });

    if (error) {
      sendJson(res, 500, { error: error.message });
      return;
    }

    sendJson(res, 201, { ok: true });
  } catch (error: any) {
    sendJson(res, 500, { error: error?.message ?? "feedback_failed" });
  }
}
