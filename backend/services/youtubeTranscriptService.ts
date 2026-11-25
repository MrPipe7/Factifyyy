/** Reads the captions of a YouTube video or Short (no API key, no audio download, no LLM quota). */

export interface YoutubeTranscript {
  videoId: string;
  title: string;
  /** "captions" when subtitles were read, "title" when only the video title was available. */
  source: "captions" | "title";
  language?: string;
  transcript: string;
}

export type YoutubeFailureCode = "INVALID_URL" | "NO_TRANSCRIPT" | "UPSTREAM_ERROR";

export interface YoutubeFailure {
  status: number;
  error: string;
  code: YoutubeFailureCode;
}

const FETCH_TIMEOUT_MS = 8000;
const INNERTUBE_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const CLIENT_VERSION = "20.10.38";
/** Longer videos are cut: the analyzer works on concrete claims, not on whole talks. */
export const MAX_TRANSCRIPT_CHARS = 1500;

/** Extracts the video id from watch, youtu.be, shorts, embed and live links. Returns null if it is not YouTube. */
export function parseYoutubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "").toLowerCase();
  const isId = (v: string | null | undefined): v is string => Boolean(v && /^[\w-]{11}$/.test(v));

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return isId(id) ? id : null;
  }
  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return isId(id) ? id : null;
    }
    const m = /^\/(shorts|embed|live|v)\/([\w-]{11})/.exec(url.pathname);
    return m ? m[2] : null;
  }
  return null;
}

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  kind?: string;
}

interface PlayerResponse {
  videoDetails?: { title?: string };
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
}

function pickTrack(tracks: CaptionTrack[]): CaptionTrack | undefined {
  const withUrl = tracks.filter((t) => t.baseUrl);
  const rank = (t: CaptionTrack) => {
    const lang = (t.languageCode ?? "").toLowerCase();
    const manual = t.kind === "asr" ? 0 : 1; // manual subtitles are usually more accurate than automatic ones
    const language = lang.startsWith("es") ? 4 : lang.startsWith("en") ? 2 : 0;
    return language * 2 + manual;
  };
  return [...withUrl].sort((a, b) => rank(b) - rank(a))[0];
}

function cleanTranscript(text: string): string {
  return text
    .replace(/\[(?:música|music|aplausos|applause)\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface InnertubeClient {
  name: string;
  version: string;
  userAgent: string;
  embed?: boolean;
}

const CLIENTS: InnertubeClient[] = [
  { name: "ANDROID", version: CLIENT_VERSION, userAgent: `com.google.android.youtube/${CLIENT_VERSION} (Linux; U; Android 14)` },
  { name: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", version: "2.0", userAgent: "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/537.36 (KHTML, like Gecko) 85.0.4183.93/6.5 TV Safari/537.36", embed: true },
  { name: "IOS", version: "20.10.4", userAgent: "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)" },
  { name: "MWEB", version: "2.20250311.03.00", userAgent: "Mozilla/5.0 (iPad; CPU OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1" },
];

async function fetchPlayerWith(client: InnertubeClient, videoId: string): Promise<PlayerResponse | null> {
  const response = await fetch(INNERTUBE_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": client.userAgent },
    body: JSON.stringify({
      context: {
        client: { clientName: client.name, clientVersion: client.version, hl: "es" },
        ...(client.embed ? { thirdParty: { embedUrl: "https://www.google.com" } } : {}),
      },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  return (await response.json()) as PlayerResponse;
}

const hasTracks = (p: PlayerResponse | null): boolean =>
  Boolean(p?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.some((t) => t.baseUrl));

async function fetchPlayer(videoId: string): Promise<PlayerResponse | null> {
  let fallback: PlayerResponse | null = null;
  for (const client of CLIENTS) {
    try {
      const player = await fetchPlayerWith(client, videoId);
      if (hasTracks(player)) return player;
      if (!fallback && player?.videoDetails?.title) fallback = player;
    } catch {
    }
  }
  return fallback;
}

async function fetchCaptionText(track: CaptionTrack): Promise<string> {
  const url = new URL(track.baseUrl as string);
  url.searchParams.set("fmt", "json3");
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) return "";
  const raw = await response.text();
  if (!raw) return "";
  const data = JSON.parse(raw) as { events?: { segs?: { utf8?: string }[] }[] };
  const text = (data.events ?? [])
    .flatMap((e) => e.segs ?? [])
    .map((s) => s.utf8 ?? "")
    .join(" ");
  return cleanTranscript(text);
}

export async function getYoutubeTranscript(rawUrl: string): Promise<YoutubeTranscript | YoutubeFailure> {
  const videoId = parseYoutubeVideoId(rawUrl);
  if (!videoId) {
    return { status: 400, error: "El enlace no parece ser de un video de YouTube.", code: "INVALID_URL" };
  }

  let player: PlayerResponse | null;
  try {
    player = await fetchPlayer(videoId);
  } catch {
    player = null;
  }
  if (!player) {
    return {
      status: 502,
      error: "No se pudo consultar el video de YouTube en este momento. Intenta de nuevo o pega el texto manualmente.",
      code: "UPSTREAM_ERROR",
    };
  }

  const title = (player.videoDetails?.title ?? "").trim();
  const track = pickTrack(player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []);

  let transcript = "";
  if (track) {
    try {
      transcript = await fetchCaptionText(track);
    } catch {
      transcript = "";
    }
  }

  if (transcript.length >= 20) {
    return {
      videoId,
      title,
      source: "captions",
      language: track?.languageCode,
      transcript: transcript.slice(0, MAX_TRANSCRIPT_CHARS),
    };
  }

  // No usable subtitles: the title alone is weak evidence, but still a claim the analyzer can check.
  if (title.length >= 20) {
    return { videoId, title, source: "title", transcript: title };
  }
  return {
    status: 422,
    error: "Este video no tiene subtítulos disponibles, así que no se pudo transcribir. Pega el texto manualmente.",
    code: "NO_TRANSCRIPT",
  };
}
