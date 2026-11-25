import { getYoutubeTranscript, parseYoutubeVideoId } from "./youtubeTranscriptService.js";

export interface AnalyzeUrlResult {
  url: string;
  title: string;
  body: string;
  textForAnalysis: string;
  /** "video" when the text is the transcript of a YouTube video or Short. */
  inputKind?: "url" | "video";
  /** For videos: "captions" (real transcript) or "title" (no subtitles, only the title was analyzed). */
  transcriptSource?: "captions" | "title";
}

export interface AnalyzeUrlError {
  status: number;
  error: string;
  code:
    | "SCRAPING_BLOCKED"
    | "PAGE_NOT_FOUND"
    | "UPSTREAM_ERROR"
    | "INSUFFICIENT_CONTENT"
    | "INVALID_URL"
    | "NO_TRANSCRIPT";
}

async function analyzeYoutube(url: string): Promise<AnalyzeUrlResult | AnalyzeUrlError> {
  const video = await getYoutubeTranscript(url);
  if ("code" in video) return video;
  const textForAnalysis = trimForAnalysis(
    video.source === "captions" && video.title ? `${video.title}. ${video.transcript}` : video.transcript,
  );
  return {
    url,
    title: video.title,
    body: video.transcript,
    textForAnalysis,
    inputKind: "video",
    transcriptSource: video.source,
  };
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
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(lowered)?.[1] ?? "";
  if (/(just a moment|attention required|access denied|request blocked|are you a robot|verifying you are human)/.test(title)) {
    return true;
  }
  // Pages that merely load a captcha/cloudflare script are normal; a block page is short and has no article text.
  const hasArticleText = (lowered.match(/<p\b/g) ?? []).length >= 3;
  return !hasArticleText && /(captcha|cloudflare|bot detection|request blocked)/.test(lowered);
}

function trimForAnalysis(text: string): string {
  return text.length > 10000 ? text.slice(0, 10000) : text;
}

export async function analyzeUrl(url: string): Promise<AnalyzeUrlResult | AnalyzeUrlError> {
  const rawUrl = url.trim();
  if (!rawUrl || !isHttpsUrl(rawUrl)) {
    return { status: 400, error: "La URL debe ser HTTPS válida.", code: "INVALID_URL" };
  }

  // YouTube pages are not scrapeable articles: read the video's subtitles instead.
  if (parseYoutubeVideoId(rawUrl)) return analyzeYoutube(rawUrl);

  let response: Response;
  try {
    response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "es-CL,es;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return {
      status: 502,
      error: "No se pudo abrir el enlace (sin respuesta del sitio). Pega el texto manualmente.",
      code: "UPSTREAM_ERROR",
    };
  }

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
