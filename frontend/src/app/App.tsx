import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./components/HomePage";
import { ResultPage } from "./components/ResultPage";
import { AboutPage } from "./components/AboutPage";
import { AnalysisResult } from "./utils/analyzer";

type Page = "home" | "result" | "about";
type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "factify.theme.v1";

function loadTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors in environments with restricted storage.
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleResult = (result: AnalysisResult) => {
    const enrichedResult: AnalysisResult = {
      ...result,
      timestamp: new Date(),
    };

    setCurrentResult(enrichedResult);
    setCurrentPage("result");
  };

  const handleAnalyzeAgain = () => {
    setCurrentResult(null);
    setCurrentPage("home");
  };

  const handleNavigate = (page: "home" | "about") => {
    if (page === "home") {
      setCurrentResult(null);
    }
    setCurrentPage(page);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="min-h-screen flex flex-col factify-app-bg factify-mesh transition-colors">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1">
        <div key={currentPage} className="factify-page-enter">
          {currentPage === "home" && (
            <HomePage onResult={handleResult} />
          )}
          {currentPage === "result" && currentResult && (
            <ResultPage result={currentResult} onAnalyzeAgain={handleAnalyzeAgain} />
          )}
        </div>
      </main>

      <footer className="factify-footer">
        <div className="factify-shell flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="factify-logo-mark w-6 h-6 rounded-md">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span style={{ fontSize: "0.875rem" }} className="text-gray-500 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-200">Factify</strong> — Plataforma de verificación de noticias
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setCurrentResult(null); setCurrentPage("home"); }} className="factify-footer-link">
              Inicio
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

