import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Cargar analyzer local
import { analyzeContent } from "../shared/analyzer.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeClassification(cls) {
  const lower = cls.toLowerCase();
  if (lower.startsWith("confiable")) return "confiable";
  if (lower.startsWith("dudos")) return "dudoso";
  if (lower.startsWith("fals")) return "falso";
  return lower;
}

export async function runEvaluationReport() {
  const dataPath = path.join(__dirname, "../data/evaluation_news.json");
  const rawData = await fs.readFile(dataPath, "utf-8");
  const cases = JSON.parse(rawData);

  const results = [];
  let correctCount = 0;
  
  const confusion_matrix = {
    Confiable: { Confiable: 0, Dudosa: 0, Falsa: 0 },
    Dudosa: { Confiable: 0, Dudosa: 0, Falsa: 0 },
    Falsa: { Confiable: 0, Dudosa: 0, Falsa: 0 }
  };

  const mapToExpectedKey = (val) => {
    if (val === "confiable") return "Confiable";
    if (val === "dudoso") return "Dudosa";
    if (val === "falso") return "Falsa";
    return val;
  };

  for (const c of cases) {
    const res = analyzeContent(c.text);
    const expected = normalizeClassification(c.expected_classification);
    const obtained = res.classification;
    
    const isCorrect = expected === obtained;
    if (isCorrect) correctCount++;
    
    const expectedKey = mapToExpectedKey(expected);
    const obtainedKey = mapToExpectedKey(obtained);
    
    if (confusion_matrix[expectedKey] && confusion_matrix[expectedKey][obtainedKey] !== undefined) {
      confusion_matrix[expectedKey][obtainedKey]++;
    }

    results.push({
      id: c.id,
      title: c.title,
      expected_classification: expectedKey,
      obtained_classification: obtainedKey,
      correct: isCorrect
    });
  }

  const false_positives = confusion_matrix["Confiable"]["Falsa"] + confusion_matrix["Confiable"]["Dudosa"];
  const false_negatives = confusion_matrix["Falsa"]["Confiable"] + confusion_matrix["Falsa"]["Dudosa"];
  
  return {
    accuracy: Math.round((correctCount / cases.length) * 100),
    correct: correctCount,
    total: cases.length,
    false_positives,
    false_positive_rate: Math.round((false_positives / 10) * 100),
    false_negatives,
    false_negative_rate: Math.round((false_negatives / 10) * 100),
    confusion_matrix,
    results
  };
}

const r = await runEvaluationReport();
console.log(`Accuracy: ${r.accuracy}% (${r.correct}/${r.total})`);
console.log(`FP: ${r.false_positives} (${r.false_positive_rate}%) FN: ${r.false_negatives} (${r.false_negative_rate}%)`);
console.log(JSON.stringify(r.confusion_matrix, null, 2));

const wrong = r.results.filter((x) => !x.correct);
if (wrong.length) {
  console.log("Incorrect cases:");
  for (const w of wrong) {
    console.log(`  #${w.id} ${w.expected_classification} -> ${w.obtained_classification}: ${w.title}`);
  }
}
