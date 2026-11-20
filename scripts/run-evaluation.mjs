import fs from "node:fs";
import path from "node:path";
import { config as loadDotEnv } from "dotenv";
import { runEvaluationReport } from "../backend/services/evaluationService.ts";

loadDotEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadDotEnv({ path: path.resolve(process.cwd(), ".env") });

// Usage: npx tsx scripts/run-evaluation.mjs [--split dev|test|all] [--mode local|full|both] [--save]
// --save writes each report as JSON under .cache/reports (never overwrites a previous one).
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const split = arg("split", "dev");
const modeArg = arg("mode", "local");
const save = process.argv.includes("--save");
const modes = modeArg === "both" ? ["local", "full"] : [modeArg];
const pad = (v, n) => String(v).padEnd(n);

for (const mode of modes) {
  const r = await runEvaluationReport({ split, mode });
  console.log(`\n=== split=${r.split} mode=${r.mode} ===`);
  console.log(`Accuracy: ${r.accuracy}% (${r.correct}/${r.total})`);
  console.log(`FP: ${r.false_positives} (${r.false_positive_rate}%) FN: ${r.false_negatives} (${r.false_negative_rate}%)`);
  if (r.mode === "full") {
    console.log(`Providers configured: ${r.providers.length ? r.providers.join(", ") : "NONE (API keys missing?)"}`);
    console.log(`External sources: ${r.coverage.with_external_sources}/${r.coverage.total} | local fallback: ${r.coverage.local_fallback}`);
  }

  console.log("\nConfusion matrix (rows = expected, columns = obtained):");
  const labels = Object.keys(r.confusion_matrix);
  console.log(`${pad("", 11)}${labels.map((l) => pad(l, 11)).join("")}`);
  for (const e of labels) {
    console.log(`${pad(e, 11)}${labels.map((o) => pad(r.confusion_matrix[e][o], 11)).join("")}`);
  }

  console.log("\nMetrics per class:");
  console.log(`${pad("", 11)}${pad("Precision", 11)}${pad("Recall", 11)}${pad("F1", 11)}Support`);
  for (const [label, m] of Object.entries(r.metrics.per_class)) {
    console.log(`${pad(label, 11)}${pad(m.precision + "%", 11)}${pad(m.recall + "%", 11)}${pad(m.f1 + "%", 11)}${m.support}`);
  }
  console.log(`Macro F1: ${r.metrics.macro_f1}%`);

  const wrong = r.results.filter((x) => !x.correct);
  if (wrong.length) {
    console.log(`\nIncorrect cases (${wrong.length}):`);
    for (const w of wrong) {
      console.log(`  #${w.id} expected ${w.expected_classification} -> got ${w.obtained_classification}: ${w.title}`);
    }
  }

  if (save) {
    const dir = path.resolve(process.cwd(), ".cache", "reports");
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(dir, `${stamp}_${r.split}_${r.mode}.json`);
    fs.writeFileSync(file, JSON.stringify(r, null, 2));
    console.log(`\nReport saved: ${path.relative(process.cwd(), file)}`);
  }
}
