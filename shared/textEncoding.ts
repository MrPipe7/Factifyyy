/**
 * Repara texto UTF-8 mal interpretado como Latin-1 (ej. vacunaciÃ³n → vacunación).
 */
export function repairUtf8Mojibake(text: string): string {
  if (!/[ÃÂ][\u0080-\u00BF]/.test(text) && !text.includes("Ã")) return text;
  try {
    const repaired = Buffer.from(text, "latin1").toString("utf8");
    if (repaired.includes("\uFFFD")) return text;
    return repaired;
  } catch {
    return text;
  }
}

function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    "&quot;": "\"",
    "&apos;": "'",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };

  let out = text.replace(/&(quot|apos|amp|lt|gt|nbsp);/gi, (m) => {
    const key = m.toLowerCase();
    return named[key] ?? m;
  });

  out = out.replace(/&#(\d+);/g, (_, num) => {
    const cp = Number.parseInt(num, 10);
    return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
  });

  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const cp = Number.parseInt(hex, 16);
    return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
  });

  return out;
}

/**
 * Limpia ruido típico de texto pegado desde web para mejorar el análisis:
 * - repara mojibake UTF-8
 * - decodifica entidades HTML (p. ej. &#34;)
 * - elimina bloques promocionales frecuentes y normaliza espacios
 */
export function normalizeAnalysisText(text: string): string {
  let out = repairUtf8Mojibake(text);
  out = decodeHtmlEntities(out);

  // Quita bloques publicitarios comunes que contaminan el contenido noticioso.
  out = out
    .replace(/Obt[eé]n acceso inmediato[\s\S]{0,500}?AARP/gi, " ")
    .replace(/suscripci[oó]n a AARP The Magazine[\s\S]{0,400}?/gi, " ")
    .replace(/\bThe Magazine\b\.?/gi, " ");

  // Normalización final.
  out = out
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  return out;
}
