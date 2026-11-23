import type { LlmCacheStore } from "../../backend/services/llmCache.js";
import type { LlmClassification } from "../../backend/services/llmVerificationService.js";
import { getSupabaseClient } from "./supabase.js";

const CACHE_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("llm_cache_timeout")), CACHE_TIMEOUT_MS)),
  ]);
}

/** Supabase-backed store (table `llm_cache`). Any error is swallowed so a cache outage never breaks verification. */
export function createSupabaseLlmCacheStore(): LlmCacheStore | null {
  let client: ReturnType<typeof getSupabaseClient>;
  try {
    client = getSupabaseClient();
  } catch {
    return null; // Supabase not configured: run without cache
  }
  return {
    async get(key) {
      try {
        const { data, error } = await withTimeout(
          client.from("llm_cache").select("classification, reason").eq("cache_key", key).maybeSingle(),
        );
        if (error || !data) return null;
        const c = data.classification as LlmClassification;
        if (c !== "falso" && c !== "confiable" && c !== "dudoso") return null;
        return { classification: c, reason: typeof data.reason === "string" ? data.reason : "" };
      } catch {
        return null;
      }
    },
    async set(key, verdict) {
      try {
        await withTimeout(
          client
            .from("llm_cache")
            .upsert({ cache_key: key, classification: verdict.classification, reason: verdict.reason }, { onConflict: "cache_key" }),
        );
      } catch {
        // ignore
      }
    },
  };
}
