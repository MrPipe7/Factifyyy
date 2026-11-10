import { runEvaluationReport, type EvaluationMode, type EvaluationSplit } from "../backend/services/evaluationService.js";
import { getErrorMessage, methodNotAllowed, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";

const SPLITS: EvaluationSplit[] = ["dev", "test", "all"];
const MODES: EvaluationMode[] = ["local", "full"];

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

  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const split = params.get("split") ?? "dev";
  const mode = params.get("mode") ?? "local";
  if (!SPLITS.includes(split as EvaluationSplit) || !MODES.includes(mode as EvaluationMode)) {
    sendJson(res, 400, { error: "Invalid split or mode" });
    return;
  }

  try {
    const report = await runEvaluationReport({
      split: split as EvaluationSplit,
      mode: mode as EvaluationMode,
      cacheDir: null,
    });
    sendJson(res, 200, report);
  } catch (error: unknown) {
    sendJson(res, 500, { error: getErrorMessage(error, "evaluation_failed") });
  }
}
