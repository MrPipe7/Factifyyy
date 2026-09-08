import { useRef, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Share2, Info, ChevronDown, ChevronUp, ShieldCheck } from "../../components/Icons";
import { AnalysisResult } from "../utils/analyzer";
import { AlertModal } from "./AlertModal";

interface ResultPageProps {
  result: AnalysisResult;
  onAnalyzeAgain: () => void;
}

const classificationConfig = {
  confiable: {
    icon: CheckCircle,
    label: "CONFIABLE",
    cardClass: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
    iconWrapClass: "bg-green-100 dark:bg-green-900/40",
    textClass: "text-green-700 dark:text-green-400",
    badgeClass: "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
    barColor: "#22c55e",
    description: "El contenido presenta características y patrones asociados a información confiable.",
  },
  dudoso: {
    icon: AlertTriangle,
    label: "DUDOSO",
    cardClass: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
    iconWrapClass: "bg-amber-100 dark:bg-amber-900/40",
    textClass: "text-amber-700 dark:text-amber-400",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    barColor: "#f59e0b",
    description: "El contenido presenta indicios de riesgo o atribuciones vagas y requiere verificación adicional.",
  },
  falso: {
    icon: XCircle,
    label: "PROBABLEMENTE FALSO",
    cardClass: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
    iconWrapClass: "bg-red-100 dark:bg-red-900/40",
    textClass: "text-red-700 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
    barColor: "#ef4444",
    description: "El contenido presenta múltiples señales fuertes asociadas a desinformación o engaño.",
  },
};

export function ResultPage({ result, onAnalyzeAgain }: ResultPageProps) {
  const [showAlert, setShowAlert] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const shareAreaRef = useRef<HTMLDivElement>(null);

  const config = classificationConfig[result.classification];
  const Icon = config.icon;
  const shouldShowAlert = result.classification !== "confiable";

  const engineLabel = "Estimación IA / Baseline NLP";
  const confidenceHint = "Nivel de confianza estimado por señales";

  const scrollToShareArea = () => {
    shareAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleShare = () => {
    if (shouldShowAlert) {
      setShowAlert(true);
      scrollToShareArea();
    } else {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(`Factify: noticia clasificada como ${config.label}.`)
          .then(() => {
            setShareNotice("Resultado copiado al portapapeles.");
            scrollToShareArea();
          })
          .catch(() => {});
      }
    }
  };

  const handleDeclineShare = () => {
    setShowAlert(false);
  };

  const handleContinueShare = () => {
    setShowAlert(false);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(`Factify: noticia clasificada como ${config.label}.`)
        .then(() => {
          setShareNotice("Resultado copiado al portapapeles.");
          scrollToShareArea();
        })
        .catch(() => {});
    }
  };

  const truncated = result.inputText.length > 150;
  const displayText = showFullText ? result.inputText : result.inputText.slice(0, 150);

  const positiveSignals = result.signals.filter((s) => s.type === "positive");
  const negativeSignals = result.signals.filter((s) => s.type === "negative");
  const warningSignals = result.signals.filter((s) => s.type === "warning");

  return (
    <>
      {showAlert && (
        <AlertModal
          classification={result.classification}
          onClose={handleDeclineShare}
          onContinue={handleContinueShare}
        />
      )}

      <div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={onAnalyzeAgain} className="btn-ghost mb-6 factify-enter factify-enter-d1">
            <RotateCcw className="w-4 h-4" />
            Analizar otra noticia
          </button>

          {/* Main result card */}
          <div className={`surface-panel surface-panel-accent rounded-2xl border-2 p-6 sm:p-8 mb-5 factify-enter factify-enter-scale factify-enter-d2 ${config.cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${config.iconWrapClass}`}>
                <Icon className={`w-9 h-9 ${config.textClass}`} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <p className="factify-section-label">Resultado del análisis</p>
                  <span
                    className={`px-3 py-0.5 rounded-full ${config.badgeClass}`}
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    {engineLabel}
                  </span>
                </div>
                <h2
                  className={`mb-1 ${config.textClass}`}
                  style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  {config.label}
                </h2>
                <p className="text-gray-600 dark:text-gray-300" style={{ fontSize: "0.925rem" }}>{config.description}</p>

                {/* Confidence bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400" style={{ fontSize: "0.8rem" }}>{confidenceHint}</span>
                    <span className={config.textClass} style={{ fontSize: "0.85rem", fontWeight: 600 }}>{result.confidence}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${result.confidence}%`, background: config.barColor }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preventive alert banner */}
          {shouldShowAlert && (
            <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-orange-800 dark:text-orange-200" style={{ fontSize: "0.86rem", lineHeight: 1.55 }}>
                  <strong>Alerta preventiva activa:</strong> este contenido presenta señales de posible desinformación. Se recomienda precaución antes de compartir.
                </p>
              </div>
            </div>
          )}

          {/* Analyzed text preview */}
          <div className="surface-panel p-5 mb-5">
            <p className="factify-section-label mb-2">Texto analizado</p>
            <p className="text-gray-700 dark:text-gray-300" style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
              {displayText}
              {truncated && !showFullText && "..."}
            </p>
            {truncated && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="mt-2 flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                style={{ fontSize: "0.825rem" }}
              >
                {showFullText ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> Mostrar texto completo</>
                )}
              </button>
            )}
          </div>

          {/* Signals detected */}
          {result.signals.length > 0 && (
            <div className="surface-panel p-5 mb-5">
              <h3 className="text-gray-800 dark:text-gray-100 mb-4" style={{ fontSize: "1rem", fontWeight: 600 }}>
                Señales detectadas por el motor NLP
              </h3>
              <div className="flex flex-col gap-3">
                {negativeSignals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-700 dark:text-red-300" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{signal.label}</p>
                      <p className="text-red-600 dark:text-red-400 mt-0.5" style={{ fontSize: "0.825rem", lineHeight: 1.5 }}>{signal.description}</p>
                    </div>
                  </div>
                ))}
                {warningSignals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-700 dark:text-amber-300" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{signal.label}</p>
                      <p className="text-amber-600 dark:text-amber-400 mt-0.5" style={{ fontSize: "0.825rem", lineHeight: 1.5 }}>{signal.description}</p>
                    </div>
                  </div>
                ))}
                {positiveSignals.map((signal, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-green-700 dark:text-green-300" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{signal.label}</p>
                      <p className="text-green-600 dark:text-green-400 mt-0.5" style={{ fontSize: "0.825rem", lineHeight: 1.5 }}>{signal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="surface-panel p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-gray-800 dark:text-gray-100" style={{ fontSize: "1rem", fontWeight: 600 }}>
                ¿Por qué fue clasificado así?
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
              {result.explanation}
            </p>
          </div>

          {/* Recommendation */}
          <div className="factify-callout mb-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="factify-callout-title mb-0">Recomendación de verificación</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
              {result.recommendation}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Fuentes oficiales", "Medios de comunicación reconocidos", "Portales institucionales"].map((label) => (
                <span
                  key={label}
                  className="px-3 py-1 rounded-full text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 bg-white dark:bg-blue-900/30"
                  style={{ fontSize: "0.8rem" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="surface-subtle p-4 mb-6">
            <p className="text-gray-400" style={{ fontSize: "0.78rem", lineHeight: 1.6 }}>
              <strong className="text-gray-500 dark:text-gray-300">Aviso informativo:</strong>{" "}
              Esta clasificación es una estimación técnica apoyada por IA y análisis de procesamiento de lenguaje natural para la versión inicial. Factify no reemplaza el criterio propio del lector.
            </p>
          </div>

          {/* Actions */}
          <div ref={shareAreaRef} className="flex flex-col sm:flex-row gap-3">
            <button onClick={onAnalyzeAgain} className="btn-ghost flex-1 justify-center py-3">
              <RotateCcw className="w-4 h-4" />
              Analizar otra noticia
            </button>
            <button
              onClick={handleShare}
              className={shouldShowAlert ? "btn-accent-warn flex-1 justify-center" : "btn-primary flex-1 justify-center"}
            >
              <Share2 className="w-4 h-4" />
              {shouldShowAlert ? "Compartir (ver advertencia)" : "Compartir resultado"}
            </button>
          </div>

          {shareNotice && (
            <p className="text-blue-600 dark:text-blue-400 mt-2 text-center" style={{ fontSize: "0.82rem" }}>
              {shareNotice}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

