import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runFactCheck, type FactCheckResult } from "./factCheckService.js";
import { verifyText } from "./verificationService.js";

export type EvaluationSplit = "dev" | "test" | "all";
export type EvaluationMode = "local" | "full";
export type ClassLabel = "Confiable" | "Dudosa" | "Falsa";

export interface EvaluationOptions {
  split?: EvaluationSplit;
  mode?: EvaluationMode;
  /** Directory used to cache external API responses (full mode). Set to null to disable. */
  cacheDir?: string | null;
  concurrency?: number;
}

interface DatasetCase {
  id: number;
  title: string;
  text: string;
  expected_classification: string;
  split?: string;
}

export interface EvaluationCaseResult {
  id: number;
  title: string;
  expected_classification: ClassLabel;
  obtained_classification: ClassLabel;
  correct: boolean;
  used_external_sources: boolean;
}

export interface EvaluationReport {
  split: EvaluationSplit;
  mode: EvaluationMode;
  accuracy: number;
  correct: number;
  total: number;
  false_positives: number;
  false_positive_rate: number;
  false_negatives: number;
  false_negative_rate: number;
  confusion_matrix: Record<ClassLabel, Record<ClassLabel, number>>;
  coverage: { with_external_sources: number; local_fallback: number; total: number };
  /** External providers that were configured (empty in full mode means API keys are missing). */
  providers: string[];
  results: EvaluationCaseResult[];
}

const CLASSES: ClassLabel[] = ["Confiable", "Dudosa", "Falsa"];
const here = path.dirname(fileURLToPath(import.meta.url));
const DATASET_PATH = path.join(here, "../../data/evaluation_dataset.json");

function toLabel(value: string): ClassLabel {
  const lower = value.toLowerCase();
  if (lower.startsWith("confiable")) return "Confiable";
  if (lower.startsWith("dudos")) return "Dudosa";
  return "Falsa";
}

function createCachedFactCheck(cacheDir: string | null) {
  return async (text: string): Promise<FactCheckResult | null> => {
    if (!cacheDir) return runFactCheck(text);
    const file = path.join(cacheDir, `${createHash("sha1").update(text).digest("hex")}.json`);
    try {
      return JSON.parse(await fs.readFile(file, "utf-8")) as FactCheckResult;
    } catch {
      // cache miss
    }
    const fresh = await runFactCheck(text);
    // Without configured providers (missing API keys) the result is not a real lookup: do not cache it.
    if (fresh.providers.length === 0) return fresh;
    try {
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(file, JSON.stringify(fresh));
    } catch {
      // read-only filesystem: continue without caching
    }
    return fresh;
  };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await task(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function runEvaluationReport(options: EvaluationOptions = {}): Promise<EvaluationReport> {
  const split = options.split ?? "dev";
  const mode = options.mode ?? "local";
  const cacheDir = options.cacheDir === undefined ? path.join(process.cwd(), ".cache", "evaluation") : options.cacheDir;

  const all = JSON.parse(await fs.readFile(DATASET_PATH, "utf-8")) as DatasetCase[];
  const cases = split === "all" ? all : all.filter((c) => c.split === split);

  const factCheck = mode === "full" ? createCachedFactCheck(cacheDir) : async () => null;

  const usedProviders = new Set<string>();
  const results = await mapWithConcurrency(cases, options.concurrency ?? 4, async (c): Promise<EvaluationCaseResult> => {
    const { result, providers } = await verifyText(c.text, { factCheck });
    providers.forEach((p) => usedProviders.add(p));
    const expected = toLabel(c.expected_classification);
    const obtained = toLabel(result.classification);
    return {
      id: c.id,
      title: c.title,
      expected_classification: expected,
      obtained_classification: obtained,
      correct: expected === obtained,
      used_external_sources: (result.sources?.length ?? 0) > 0,
    };
  });

  const confusion_matrix = Object.fromEntries(
    CLASSES.map((e) => [e, Object.fromEntries(CLASSES.map((o) => [o, 0]))]),
  ) as Record<ClassLabel, Record<ClassLabel, number>>;
  for (const r of results) confusion_matrix[r.expected_classification][r.obtained_classification]++;

  const classTotal = (label: ClassLabel) => results.filter((r) => r.expected_classification === label).length;
  const correct = results.filter((r) => r.correct).length;
  const false_positives = confusion_matrix.Confiable.Falsa + confusion_matrix.Confiable.Dudosa;
  const false_negatives = confusion_matrix.Falsa.Confiable + confusion_matrix.Falsa.Dudosa;
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const withSources = results.filter((r) => r.used_external_sources).length;

  return {
    split,
    mode,
    accuracy: pct(correct, results.length),
    correct,
    total: results.length,
    false_positives,
    false_positive_rate: pct(false_positives, classTotal("Confiable")),
    false_negatives,
    false_negative_rate: pct(false_negatives, classTotal("Falsa")),
    confusion_matrix,
    coverage: { with_external_sources: withSources, local_fallback: results.length - withSources, total: results.length },
    providers: [...usedProviders],
    results,
  };
}
