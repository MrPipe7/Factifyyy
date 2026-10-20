import type { AnalysisResult, Classification } from "./analyzer";

const HISTORY_STORAGE_KEY = "factify.history.v1";
const MAX_HISTORY_ITEMS = 100;

export interface HistoryEntry extends AnalysisResult {
  id: string;
  savedAt: Date;
}

interface RawHistoryEntry extends Omit<HistoryEntry, "timestamp" | "savedAt"> {
  timestamp: string;
  savedAt: string;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseDate(value: unknown): Date {
  if (typeof value !== "string") return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toRaw(entry: HistoryEntry): RawHistoryEntry {
  return {
    ...entry,
    timestamp: entry.timestamp.toISOString(),
    savedAt: entry.savedAt.toISOString(),
  };
}

function fromRaw(entry: RawHistoryEntry): HistoryEntry {
  return {
    ...entry,
    timestamp: parseDate(entry.timestamp),
    savedAt: parseDate(entry.savedAt),
  };
}

export function loadHistory(): HistoryEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RawHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(fromRaw)
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
  } catch {
    return [];
  }
}

export function saveToHistory(result: AnalysisResult): HistoryEntry {
  const entry: HistoryEntry = {
    ...result,
    id: globalThis.crypto?.randomUUID?.() ?? `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date(),
  };

  const current = loadHistory();
  const next = [entry, ...current].slice(0, MAX_HISTORY_ITEMS);

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next.map(toRaw)));
    } catch {
      // Ignore storage quota/privacy mode failures.
    }
  }

  return entry;
}

export function removeHistoryEntry(id: string): HistoryEntry[] {
  const current = loadHistory();
  const next = current.filter((item) => item.id !== id);

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next.map(toRaw)));
    } catch {
      // Ignore storage failures.
    }
  }

  return next;
}

export function filterHistory(entries: HistoryEntry[], query: string, risk: Classification | "all"): HistoryEntry[] {
  const normalized = query.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesRisk = risk === "all" || entry.classification === risk;
    if (!matchesRisk) return false;
    if (!normalized) return true;

    const haystack = [
      entry.inputText,
      entry.explanation,
      entry.recommendation,
      entry.classification,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
