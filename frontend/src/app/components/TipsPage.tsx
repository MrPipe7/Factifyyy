import { useMemo, useState } from "react";
import { BookOpen, Brain, Search, ShieldCheck } from "../../components/Icons";
import { tipsData, type TipItem, type TipsCategory } from "../data/tipsData";

const categoryConfig: Record<TipsCategory | "all", { label: string; icon: typeof Brain }> = {
  all: { label: "Todos", icon: BookOpen },
  sesgos: { label: "Sesgos", icon: Brain },
  clickbait: { label: "Clickbait", icon: Search },
  fuentes: { label: "Fuentes", icon: ShieldCheck },
};

function filterTips(items: TipItem[], category: TipsCategory | "all"): TipItem[] {
  if (category === "all") return items;
  return items.filter((tip) => tip.category === category);
}

export function TipsPage() {
  const [category, setCategory] = useState<TipsCategory | "all">("all");
  const [hovered, setHovered] = useState<TipsCategory | "all" | null>(null);
  const filtered = useMemo(() => filterTips(tipsData, category), [category]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="surface-panel p-6 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-gray-800 dark:text-gray-100" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            Consejos educativos
          </h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "0.9rem" }}>
          Explora guias breves de alfabetizacion mediatica para detectar desinformacion y sesgos.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {Object.entries(categoryConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const active = category === key;
            const isHovered = hovered === key;
            return (
              <button
                key={key}
                onClick={() => setCategory(key as TipsCategory | "all")}
                onMouseEnter={() => setHovered(key as TipsCategory | "all")}
                onMouseLeave={() => setHovered(null)}
                className={`relative overflow-hidden px-3 py-2 rounded-lg border flex items-center gap-2 transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-700/35 -translate-y-0.5 ring-2 ring-blue-300/70 dark:bg-blue-500 dark:border-blue-400 dark:ring-blue-500/50"
                    : isHovered
                      ? "bg-blue-500/90 text-white border-blue-400 -translate-y-0.5 scale-[1.02] shadow-md shadow-blue-500/25 dark:bg-blue-500/90 dark:text-white dark:border-blue-400"
                      : "bg-blue-50/70 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700/60"
                }`}
                style={{ fontSize: "0.85rem", fontWeight: 600 }}
              >
                {!active && isHovered && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${active ? "drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]" : ""}`} />
                <span className="relative z-10">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((tip) => (
          <article key={tip.id} className="surface-panel p-5 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2" style={{ fontWeight: 700 }}>
              {categoryConfig[tip.category].label}
            </p>
            <h3 className="text-gray-800 dark:text-gray-100 mb-2" style={{ fontSize: "1rem", fontWeight: 700 }}>
              {tip.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              {tip.description}
            </p>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-3">
              <p className="text-blue-700 dark:text-blue-300" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                <strong>Que hacer:</strong> {tip.action}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
