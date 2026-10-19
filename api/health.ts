import { sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";

export default function handler(_req: ApiRequest, res: ApiResponse) {
  sendJson(res, 200, { ok: true, service: "factify-api" });
}
