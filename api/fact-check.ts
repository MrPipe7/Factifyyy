import type { AnalysisResult } from "../shared/analyzer.js";
import { methodNotAllowed, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";
import path from "node:path";
import { config as loadDotEnv } from "dotenv";
import { runFactCheck } from "../backend/services/factCheckService.js";

loadDotEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadDotEnv();

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = (await readJsonBody(req)) as Partial<AnalysisResult> & { text?: string };
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      sendJson(res, 400, { error: "El campo text es obligatorio." });
      return;
    }

    const result = await runFactCheck(text);
    sendJson(res, 200, result);
  } catch (error: any) {
    sendJson(res, 500, { error: error?.message ?? "fact_check_failed" });
  }
}
