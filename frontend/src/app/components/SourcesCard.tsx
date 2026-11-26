import { ExternalLink } from "../../components/Icons";
import { AnalysisResult } from "../utils/analyzer";

interface SourcesCardProps {
  result: AnalysisResult;
}

export function SourcesCard({ result }: SourcesCardProps) {
  const sources = result.sources ?? [];

  if (!sources.length) return null;

  return (
    <div className="surface-panel p-5 mb-5">
      <h3 className="text-gray-800 dark:text-gray-100 mb-2" style={{ fontSize: "1rem", fontWeight: 600 }}>
        Trazabilidad y fuentes de contraste
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-3" style={{ fontSize: "0.85rem" }}>
        Se encontraron {sources.length} fuentes para contrastar esta noticia.
      </p>


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
