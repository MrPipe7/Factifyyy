import { Shield, Moon, Sun } from "../../components/Icons";

type Page = "home" | "result";
type ThemeMode = "light" | "dark";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function Navbar({ currentPage, onNavigate, theme, onToggleTheme }: NavbarProps) {
  const isDark = theme === "dark";

  return (
    <nav className="factify-navbar w-full top-0 z-50 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onNavigate("home")}
          >
            <div className="w-8 h-8 rounded-lg bg-[#1e4f9c] flex items-center justify-center shadow-md shadow-blue-900/20 group-hover:bg-[#153e7d] transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[1.1rem] font-bold text-[#1e4f9c] dark:text-blue-400 tracking-tight leading-none">
                Factify
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-full border border-gray-200/50 dark:border-gray-700/50 mr-2">
            {[
              { id: "home", label: "Inicio" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as "home")}
                className={`px-4 py-1.5 rounded-full text-[0.85rem] font-medium transition-all ${
                  currentPage === item.id
                    ? "bg-white dark:bg-gray-700 text-[#1e4f9c] dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
