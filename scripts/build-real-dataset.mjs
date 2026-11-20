// Builds data/evaluation_real.json from real, already fact-checked claims (Google Fact Check Tools API).
// Usage: node scripts/build-real-dataset.mjs
// Labels come from the fact-checker's textual rating: false -> Falsa, misleading/needs context -> Dudosa, true -> Confiable.
import fs from "node:fs";
import path from "node:path";
import { config as loadDotEnv } from "dotenv";

loadDotEnv({ path: path.resolve(process.cwd(), ".env.local") });
const key = process.env.GOOGLE_FACT_CHECK_API_KEY;
if (!key) throw new Error("GOOGLE_FACT_CHECK_API_KEY missing");

const QUERIES = [
  "vacuna", "covid", "elecciones", "gobierno", "salud", "inflación", "economía", "impuestos", "inmigración",
  "educación", "energía", "clima", "agua", "alimentos", "dinero", "banco", "policía", "delincuencia", "ley",
  "presidente", "congreso", "pensiones", "trabajo", "precios", "cáncer", "medicamento", "tecnología", "whatsapp",
  "redes sociales", "incendio", "terremoto", "guerra", "ciencia", "universidad", "hospital", "transporte",
];
const PER_CLASS = { Confiable: 40, Dudosa: 40, Falsa: 40 };

const FALSE = /^(falso|falsa|bulo|no hay pruebas|sin pruebas|sin evidencia|falso\.|fake|mentira)/;
const MISLEADING = /^(enga[nñ]oso|contexto|impreciso|cuestionable|exagerado|discutible|verdad a medias|necesita contexto|falta contexto|distorsiona|sin contexto|inexacto)/;
const TRUE = /^(verdadero|cierto|verdad|real|correcto|true)\b/;

function label(rating) {
  const r = rating.trim().toLowerCase();
  if (FALSE.test(r)) return "Falsa";
  if (MISLEADING.test(r)) return "Dudosa";
  if (TRUE.test(r)) return "Confiable";
  return null;
}

const seen = new Set();
const buckets = { Confiable: [], Dudosa: [], Falsa: [] };
for (const q of QUERIES) {
  const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(q)}&languageCode=es&pageSize=100&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) { console.log(q, "HTTP", res.status); continue; }
  const data = await res.json();
  for (const c of data.claims ?? []) {
    const review = c.claimReview?.[0];
    if (!review || !c.text) continue;
    const text = c.text.replace(/^["“”']+|["“”']+$/g, "").replace(/\s+/g, " ").trim();
    const cls = label(review.textualRating ?? "");
    if (!cls || text.length < 40 || text.length > 320 || seen.has(text)) continue;
    seen.add(text);
    buckets[cls].push({
      title: text.slice(0, 70),
      text,
      expected_classification: cls,
      validation_source: `${review.publisher?.name ?? "verificador"}: ${review.textualRating}`,
      notes: "Afirmación real verificada por un fact-checker.",
      split: "real",
    });
  }
}

const out = [];
let id = 1000;
for (const cls of Object.keys(PER_CLASS)) {
  console.log(cls, "disponibles:", buckets[cls].length);
  for (const item of buckets[cls].slice(0, PER_CLASS[cls])) out.push({ id: ++id, ...item });
}
fs.writeFileSync(path.resolve("data/evaluation_real.json"), JSON.stringify(out, null, 2) + "\n");
console.log("guardados:", out.length);
