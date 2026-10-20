import { useMemo, useState } from "react";
import { Clock, Search, Trash2, History as HistoryIcon } from "../../components/Icons";
import type { Classification } from "../utils/analyzer";
import { filterHistory, removeHistoryEntry, type HistoryEntry } from "../utils/historyService";

interface HistoryPageProps {
  entries: HistoryEntry[];
  onEntriesChange: (entries: HistoryEntry[]) => void;
  onOpenEntry: (entry: HistoryEntry) => void;
}

const riskOptions: Array<{ value: Classification | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "confiable", label: "Confiable" },
  { value: "dudoso", label: "Dudoso" },
  { value: "falso", label: "Falso" },
];

const riskBadgeClass: Record<Classification, string> = {
  confiable: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  dudoso: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  falso: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function HistoryPage({ entries, onEntriesChange, onOpenEntry }: HistoryPageProps) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<Classification | "all">("all");

  const filtered = useMemo(() => filterHistory(entries, query, risk), [entries, query, risk]);

  const handleDelete = (id: string) => {
    const next = removeHistoryEntry(id);
    onEntriesChange(next);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="surface-panel p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <HistoryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-gray-800 dark:text-gray-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            Historial privado de verificaciones
          </h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "0.9rem" }}>
          Se guarda solo en este navegador, sin cuenta y sin compartir tus consultas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por palabra clave..."
              className="field pl-9"
            />
          </div>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as Classification | "all")}
            className="field"
          >
            {riskOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-subtle p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay verificaciones para mostrar con los filtros actuales.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="surface-panel p-4 border border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${riskBadgeClass[entry.classification]}`}
                    >
                      {entry.classification.toUpperCase()}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1" style={{ fontSize: "0.75rem" }}>
                      <Clock className="w-3.5 h-3.5" />
                      {entry.savedAt.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {entry.inputText.length > 220 ? `${entry.inputText.slice(0, 220)}...` : entry.inputText}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn-ghost" onClick={() => onOpenEntry(entry)}>
                    Ver resultado
                  </button>
                  <button
                    className="btn-ghost text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(entry.id)}
                    title="Eliminar del historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
