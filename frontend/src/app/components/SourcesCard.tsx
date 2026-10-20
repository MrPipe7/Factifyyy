import { ExternalLink } from "../../components/Icons";
import { AnalysisResult } from "../utils/analyzer";

interface SourcesCardProps {
  result: AnalysisResult;
}

export function SourcesCard({ result }: SourcesCardProps) {
  const sources = result.sources ?? [];
  const sourceStats = result.sourceStats;

  if (!sources.length) return null;

  return (
    <div className="surface-panel p-5 mb-5">
      <h3 className="text-gray-800 dark:text-gray-100 mb-2" style={{ fontSize: "1rem", fontWeight: 600 }}>
        Trazabilidad y fuentes de contraste
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-3" style={{ fontSize: "0.85rem" }}>
        Se encontraron {sources.length} fuentes para contrastar esta noticia.
      </p>

      {sourceStats && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800" style={{ fontSize: "0.75rem" }}>
            Coincidencias oficiales: {sourceStats.support}
          </span>
          <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800" style={{ fontSize: "0.75rem" }}>
            Referencias neutrales: {sourceStats.neutral}
          </span>
          <span className="px-2 py-1 rounded bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" style={{ fontSize: "0.75rem" }}>
            Total: {sourceStats.total}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sources.map((source, idx) => (
          <a
            key={`${source.url}-${idx}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="factify-source-link block border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-gray-800 dark:text-gray-100" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                {source.title}
              </p>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "0.78rem" }}>
                {source.publisher ?? "Fuente externa"}
              </p>
              <span
                className={`px-2 py-0.5 rounded-full border ${
                  source.stance === "support"
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                    : source.stance === "contradict"
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                }`}
                style={{ fontSize: "0.72rem", fontWeight: 600 }}
                title="Postura de la fuente respecto a la afirmación que ingresaste"
              >
                {source.stance === "support"
                  ? "Respalda afirmación"
                  : source.stance === "contradict"
                    ? "Desmiente afirmación"
                    : "Sin postura clara"}
              </span>
            </div>
            {source.snippet && (
              <p className="text-gray-600 dark:text-gray-300 mt-2" style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                {source.snippet}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
