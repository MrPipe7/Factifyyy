import { getSupabaseClient } from "../../api/_lib/supabase.js";

export async function persistFeedback(verificationId: string, vote: "helpful" | "not_helpful", comment?: string | null) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("user_feedback").insert({
    verification_id: verificationId,
    vote,
    comment: comment?.trim() || null,
  });
  return { error };
}
