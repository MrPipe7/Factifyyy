import type { IncomingMessage, ServerResponse } from "node:http";

export type ApiRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

export type ApiResponse = ServerResponse;

export async function readJsonBody(req: ApiRequest): Promise<unknown> {
  if (req.body !== undefined) return req.body;

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

export function sendJson(res: ApiResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export function methodNotAllowed(res: ApiResponse): void {
  sendJson(res, 405, { error: "Method not allowed" });
}
