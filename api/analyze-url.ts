import { methodNotAllowed, readJsonBody, sendJson, type ApiRequest, type ApiResponse } from "./_lib/http.js";

interface AnalyzeUrlBody {
  url?: string;
}

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(raw: string): string {
  return decodeHtmlEntities(raw)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickMeta(html: string, prop: string): string {
  const direct = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  ).exec(html);
  if (direct?.[1]) return cleanText(direct[1]);

  const reverse = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["'][^>]*>`,
    "i",
  ).exec(html);
  return reverse?.[1] ? cleanText(reverse[1]) : "";
}

function extractArticleBody(html: string): string {
  const contentBlocks: string[] = [];
  const articleMatch = /<article[\s\S]*?<\/article>/i.exec(html);
  const source = articleMatch?.[0] ?? html;

  const paragraphRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null = paragraphRegex.exec(source);
  while (match && contentBlocks.length < 12) {
    const cleaned = cleanText(match[1] ?? "");
    if (cleaned.length >= 40) contentBlocks.push(cleaned);
    match = paragraphRegex.exec(source);
  }

  return contentBlocks.join(" ");
}

function looksBlocked(html: string): boolean {
  const lowered = html.toLowerCase();
  return (
    lowered.includes("captcha") ||
    lowered.includes("access denied") ||
    lowered.includes("cloudflare") ||
    lowered.includes("bot detection") ||
    lowered.includes("request blocked")
  );
}

function trimForAnalysis(text: string): string {
  return text.length > 10000 ? text.slice(0, 10000) : text;
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

    if (!isHttpsUrl(rawUrl)) {
      sendJson(res, 400, { error: "La URL debe ser HTTPS válida." });
      return;
    }

    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "FactifyBot/1.0 (+https://factify.app)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (response.status === 403) {
      sendJson(res, 403, {
        error: "El sitio bloqueó la extracción automática (403).",
        code: "SCRAPING_BLOCKED",
      });
      return;
    }

    if (response.status === 404) {
      sendJson(res, 404, {
        error: "No se encontró la página solicitada (404).",
        code: "PAGE_NOT_FOUND",
      });
      return;
    }

    if (!response.ok) {
      sendJson(res, 502, {
        error: `No se pudo acceder al enlace (HTTP ${response.status}).`,
        code: "UPSTREAM_ERROR",
      });
      return;
    }

    const html = await response.text();
    if (looksBlocked(html)) {
      sendJson(res, 403, {
        error: "El sitio activó protección anti-scraping.",
        code: "SCRAPING_BLOCKED",
      });
      return;
    }

    const ogTitle = pickMeta(html, "og:title");
    const ogDescription = pickMeta(html, "og:description");
    const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
    const extractedTitle = ogTitle || cleanText(titleTag);
    const extractedBody = extractArticleBody(html) || ogDescription;

    const textForAnalysis = trimForAnalysis(
      [extractedTitle, extractedBody].filter(Boolean).join(". "),
    );

    if (textForAnalysis.trim().length < 20) {
      sendJson(res, 422, {
        error: "No se pudo extraer suficiente contenido del enlace. Ingresa el texto manualmente.",
        code: "INSUFFICIENT_CONTENT",
      });
      return;
    }

    sendJson(res, 200, {
      url: rawUrl,
      title: extractedTitle,
      body: extractedBody,
      textForAnalysis,
    });
  } catch (error: any) {
    sendJson(res, 500, {
      error: error?.message ?? "analyze_url_failed",
    });
  }
}
