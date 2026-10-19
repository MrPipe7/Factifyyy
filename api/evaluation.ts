import { runEvaluationReport } from "../scripts/run-evaluation.mjs";
import { methodNotAllowed, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  const expected = process.env.FACTIFY_ADMIN_KEY;
  const provided = (req.headers["x-factify-admin-key"] as string | undefined) ?? "";

  if (!expected || provided !== expected) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const report = await runEvaluationReport();
    sendJson(res, 200, report);
  } catch (error: any) {
    sendJson(res, 500, { error: error?.message ?? "evaluation_failed" });
  }
}
