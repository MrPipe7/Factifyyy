import { useRef, useState } from "react";
import { Search, Shield, CheckCircle, AlertTriangle, XCircle, FileText, Brain } from "../../components/Icons";
import { AnalysisResult } from "../utils/analyzer";
import { verifyContent } from "../utils/verifyClient";
import { WelcomeSection } from "./WelcomeSection";

interface HomePageProps {
  onResult: (result: AnalysisResult) => void;
}

export function HomePage({ onResult }: HomePageProps) {
  const analyzerRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (value: string) => {
    setInputText(value);
    if (error) setError("");
  };

  const handleAnalyze = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setError("Por favor, ingresa el texto de la noticia para analizar.");
      return;
    }
    if (trimmed.length < 20) {
      setError("El texto debe contener al menos 20 caracteres.");
      return;
    }
    if (trimmed.length > 10000) {
      setError("El texto no puede superar los 10.000 caracteres.");
      return;
    }

    setError("");
    setLoading(true);

    verifyContent(trimmed)
      .then((result) => {
        setLoading(false);
        onResult(result);
      })
      .catch(() => {
        setLoading(false);
        setError("Ocurrió un error al procesar el texto. Inténtalo nuevamente.");
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  };

  const scrollToAnalyzer = () => {
    analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <WelcomeSection onStart={scrollToAnalyzer} />

        <div ref={analyzerRef} id="verificar" className="factify-analyzer-anchor max-w-4xl mx-auto factify-enter factify-enter-d5 mb-8">
          <h2 className="factify-section-heading">Verificación de noticias</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 max-w-2xl mx-auto" style={{ fontSize: "0.95rem", lineHeight: 1.6 }}>
            Pega el texto de cualquier noticia y nuestro motor basado en Procesamiento de Lenguaje Natural analizará patrones y señales para estimar su confiabilidad.
          </p>
        </div>

        <div className="max-w-4xl mx-auto factify-enter factify-enter-d5">
          <div className="surface-panel p-1 sm:p-2 shadow-sm rounded-xl mb-12">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                <FileText className="w-4 h-4" />
                <span>Ingreso de noticia en formato texto</span>
              </div>
              <span className="text-xs text-gray-400">
                {inputText.length} / 10.000 caracteres
              </span>
            </div>

            <div className="p-6">
              <textarea
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pega aquí el texto de la noticia que deseas verificar... (mínimo 20 caracteres, pulsa Ctrl+Enter para analizar)"
                className="field resize-none"
                rows={7}
              />

              {error && (
                <p className="mt-2 text-red-500 flex items-center gap-1.5" style={{ fontSize: "0.875rem" }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-5 gap-4">
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                  Factify analiza patrones lingüísticos, lenguaje alarmista, mayúsculas y referencias a fuentes para estimar su confiabilidad.
                </p>
                <button onClick={handleAnalyze} disabled={loading} className="btn-primary flex-shrink-0">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analizar noticia
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto factify-enter factify-enter-d7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 factify-stagger">
            {[
              {
                icon: FileText,
                iconColor: "text-blue-600 dark:text-blue-400",
                wrapClass: "bg-blue-50 dark:bg-blue-900/30",
                title: "1. Ingreso de texto",
                desc: "Pega el cuerpo o titular de la noticia",
              },
              {
                icon: Brain,
                iconColor: "text-indigo-600 dark:text-indigo-400",
                wrapClass: "bg-indigo-50 dark:bg-indigo-900/25",
                title: "2. Motor IA / NLP",
                desc: "Detección de señales de desinformación",
              },
              {
                icon: Shield,
                iconColor: "text-emerald-600 dark:text-emerald-400",
                wrapClass: "bg-emerald-50 dark:bg-emerald-900/25",
                title: "3. Resultado y alerta",
                desc: "Clasificación, explicación y advertencia",
              },
            ].map((step, i) => (
              <div key={i} className="card-tonal p-5 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${step.wrapClass}`}>
                  <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200" style={{ fontSize: "0.95rem" }}>
                    {step.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontSize: "0.825rem", lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="surface-subtle p-5 sm:p-6 mb-16 text-center">
            <h3 className="text-gray-700 dark:text-gray-300 font-semibold mb-3" style={{ fontSize: "0.9rem" }}>
              Escala de clasificación
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: CheckCircle,
                  label: "Confiable",
                  textClass: "text-green-700 dark:text-green-400",
                  cardClass: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
                  desc: "Menciona fuentes verificables, bajo riesgo textual y ausencia de patrones sensacionalistas.",
                },
                {
                  icon: AlertTriangle,
                  label: "Dudoso",
                  textClass: "text-amber-700 dark:text-amber-400",
                  cardClass: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
                  desc: "Información incompleta, atribución vaga de fuentes o presencia moderada de señales alarmistas.",
                },
                {
                  icon: XCircle,
                  label: "Falso",
                  textClass: "text-red-700 dark:text-red-400",
                  cardClass: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
                  desc: "Presencia marcada de clickbait, mayúsculas excesivas, afirmaciones imposibles o manipulación.",
                },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg p-4 ${item.cardClass}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className={`w-5 h-5 ${item.textClass}`} />
                    <span className={item.textClass} style={{ fontWeight: 600 }}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

