export interface AnalyzeUrlResult {
  url: string;
  title: string;
  body: string;
  textForAnalysis: string;
}

export interface AnalyzeUrlError {
  status: number;
  error: string;
  code: "SCRAPING_BLOCKED" | "PAGE_NOT_FOUND" | "UPSTREAM_ERROR" | "INSUFFICIENT_CONTENT" | "INVALID_URL";
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

export async function analyzeUrl(url: string): Promise<AnalyzeUrlResult | AnalyzeUrlError> {
  const rawUrl = url.trim();
  if (!rawUrl || !isHttpsUrl(rawUrl)) {
    return { status: 400, error: "La URL debe ser HTTPS válida.", code: "INVALID_URL" };
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
    return { status: 403, error: "El sitio bloqueó la extracción automática (403).", code: "SCRAPING_BLOCKED" };
  }
  if (response.status === 404) {
    return { status: 404, error: "No se encontró la página solicitada (404).", code: "PAGE_NOT_FOUND" };
  }
  if (!response.ok) {
    return { status: 502, error: `No se pudo acceder al enlace (HTTP ${response.status}).`, code: "UPSTREAM_ERROR" };
  }

  const html = await response.text();
  if (looksBlocked(html)) {
    return { status: 403, error: "El sitio activó protección anti-scraping.", code: "SCRAPING_BLOCKED" };
  }

  const ogTitle = pickMeta(html, "og:title");
  const ogDescription = pickMeta(html, "og:description");
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const extractedTitle = ogTitle || cleanText(titleTag);
  const extractedBody = extractArticleBody(html) || ogDescription;
  const textForAnalysis = trimForAnalysis([extractedTitle, extractedBody].filter(Boolean).join(". "));

  if (textForAnalysis.trim().length < 20) {
    return {
      status: 422,
      error: "No se pudo extraer suficiente contenido del enlace. Ingresa el texto manualmente.",
      code: "INSUFFICIENT_CONTENT",
    };
  }

  return { url: rawUrl, title: extractedTitle, body: extractedBody, textForAnalysis };
}
