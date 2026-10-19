import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { config as loadDotEnv } from "dotenv";

// Local DX: allow Serverless Functions to read .env.local when running `vercel dev`.
loadDotEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadDotEnv();

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getSupabaseClient() {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const supabaseAnonKey = requiredEnv("SUPABASE_ANON_KEY");
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
