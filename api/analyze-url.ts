import { methodNotAllowed, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";
import { analyzeUrl } from "../backend/services/analyzeUrlService.js";

interface AnalyzeUrlBody {
  url?: string;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = (await readJsonBody(req)) as AnalyzeUrlBody;
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      sendJson(res, 400, { error: "Debes ingresar una URL." });
      return;
    }
    const extracted = await analyzeUrl(rawUrl);
    if ("status" in extracted) {
      sendJson(res, extracted.status, {
        error: extracted.error,
        code: extracted.code,
      });
      return;
    }
    sendJson(res, 200, extracted);
  } catch (error: any) {
    sendJson(res, 500, {
      error: error?.message ?? "analyze_url_failed",
    });
  }
}
