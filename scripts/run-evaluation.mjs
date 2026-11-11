import path from "node:path";
import { config as loadDotEnv } from "dotenv";
import { runEvaluationReport } from "../backend/services/evaluationService.ts";

loadDotEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadDotEnv({ path: path.resolve(process.cwd(), ".env") });

// Usage: npx tsx scripts/run-evaluation.mjs [--split dev|test|all] [--mode local|full|both]
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const split = arg("split", "dev");
const modeArg = arg("mode", "local");
const modes = modeArg === "both" ? ["local", "full"] : [modeArg];

for (const mode of modes) {
  const r = await runEvaluationReport({ split, mode });
  console.log(`\n=== split=${r.split} mode=${r.mode} ===`);
  console.log(`Accuracy: ${r.accuracy}% (${r.correct}/${r.total})`);
  console.log(`FP: ${r.false_positives} (${r.false_positive_rate}%) FN: ${r.false_negatives} (${r.false_negative_rate}%)`);
  if (r.mode === "full") {
    console.log(`Providers configured: ${r.providers.length ? r.providers.join(", ") : "NONE (API keys missing?)"}`);
    console.log(`External sources: ${r.coverage.with_external_sources}/${r.coverage.total} | local fallback: ${r.coverage.local_fallback}`);
  }
  console.log(JSON.stringify(r.confusion_matrix, null, 2));
  const wrong = r.results.filter((x) => !x.correct);
  if (wrong.length) {
    console.log("Incorrect cases:");
    for (const w of wrong) {
      console.log(`  #${w.id} ${w.expected_classification} -> ${w.obtained_classification}: ${w.title}`);
    }
  }
}
