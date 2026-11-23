import { createHash } from "node:crypto";
import { PROMPT_VERSION, type LlmJudge, type LlmVerdict } from "./llmVerificationService.js";

/** Persistent store for LLM verdicts (Supabase in production). Implementations must never throw. */
export interface LlmCacheStore {
  get(key: string): Promise<LlmVerdict | null>;
  set(key: string, verdict: LlmVerdict): Promise<void>;
}

const CACHE_SALT = "prod1";

/** Same claim written with different case, accents, punctuation or spacing shares one cache entry. */
export function normalizeClaimForCache(claim: string): string {
  return claim
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The prompt version is part of the key, so changing the prompt never serves stale verdicts. */
export function buildCacheKey(claim: string): string {
  // CACHE_SALT lets us invalidate every stored verdict (e.g. entries written during development) without a DB migration.
  return createHash("sha1").update(`${PROMPT_VERSION}:${CACHE_SALT}:${normalizeClaimForCache(claim)}`).digest("hex");
}

/**
 * Wraps an LLM judge with a persistent cache: repeated claims do not spend quota and always get the same verdict.
 * Cache errors are ignored (the judge is called as usual); failed judge calls (null) are never cached.
 */
export function withLlmCache(judge: LlmJudge, store: LlmCacheStore): LlmJudge {
  return async (claim, sources) => {
    const key = buildCacheKey(claim);
    try {
      const hit = await store.get(key);
      if (hit) return hit;
    } catch {
      // cache unavailable: fall through to the judge
    }
    const verdict = await judge(claim, sources);
    if (verdict) {
      try {
        await store.set(key, verdict);
      } catch {
        // cache unavailable: the verdict is still returned
      }
    }
    return verdict;
  };
}
