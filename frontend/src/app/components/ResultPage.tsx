import { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, RotateCcw, Share2, Info, ChevronDown, ChevronUp, ShieldCheck, ThumbsUp, ThumbsDown } from "../../components/Icons";
import { AnalysisResult } from "../utils/analyzer";
import { AlertModal } from "./AlertModal";
import { SourcesCard } from "./SourcesCard";

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
  const [feedbackVote, setFeedbackVote] = useState<"helpful" | "not_helpful" | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackVerificationId, setFeedbackVerificationId] = useState<string | null>(result.verificationId ?? null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastKind, setToastKind] = useState<"success" | "error">("success");
  const [warningPulse, setWarningPulse] = useState(false);
  const [pendingShareWarning, setPendingShareWarning] = useState(false);
  const shareAreaRef = useRef<HTMLDivElement>(null);
  const warningBannerRef = useRef<HTMLDivElement>(null);

  const config = classificationConfig[result.classification];
  const Icon = config.icon;
  const shouldShowAlert = result.classification !== "confiable";

  const scrollToShareArea = () => {
    shareAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollToWarningBanner = () => {
    const node = warningBannerRef.current;
    if (!node) return;
    const headerOffset = 90;
    const y = node.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  };

  const handleShare = () => {
    if (shouldShowAlert) {
      setPendingShareWarning(true);
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
  const shouldShowLocalSignals = Boolean(result.preliminaryLocal || !(result.sources && result.sources.length > 0));

  useEffect(() => {
    if (!pendingShareWarning || !shouldShowAlert) return;
    scrollToWarningBanner();
    const followUp = window.setTimeout(() => scrollToWarningBanner(), 240);
    const openModal = window.setTimeout(() => setShowAlert(true), 320);
    setWarningPulse(true);
    const timer = window.setTimeout(() => setWarningPulse(false), 900);
    const resetPending = window.setTimeout(() => setPendingShareWarning(false), 340);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(followUp);
      window.clearTimeout(openModal);
      window.clearTimeout(resetPending);
    };
  }, [pendingShareWarning, shouldShowAlert]);

  const showToast = (message: string, kind: "success" | "error") => {
    setToastKind(kind);
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2600);
  };

  const handleSendFeedback = async () => {
    if (!feedbackVote) {
      showToast("Selecciona si la explicación fue útil o no.", "error");
      return;
    }
    setSendingFeedback(true);
    try {
      let verificationId = feedbackVerificationId;
      if (!verificationId) {
        const reverifyResponse = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: result.inputText,
            kind: result.inputKind ?? "text",
          }),
        });

        if (!reverifyResponse.ok) {
          throw new Error("reverify_failed");
        }

        const reverifyPayload = await reverifyResponse.json().catch(() => ({}));
        verificationId = typeof reverifyPayload?.verificationId === "string" ? reverifyPayload.verificationId : null;
        if (!verificationId) {
          throw new Error("verification_id_missing");
        }
        setFeedbackVerificationId(verificationId);
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          vote: feedbackVote,
          comment: feedbackComment.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "feedback_failed");
      }

      setFeedbackComment("");
      setFeedbackVote(null);
      setFeedbackSent(true);
      showToast("¡Gracias! Tu retroalimentación fue registrada correctamente.", "success");
    } catch {
      showToast("No se pudo enviar la retroalimentación. Verifica que /api/verify y /api/feedback estén activos.", "error");
    } finally {
      setSendingFeedback(false);
    }
  };

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
                </div>
                <h2
                  className={`mb-1 ${config.textClass}`}
                  style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  {config.label}
                </h2>
                <p className="text-gray-600 dark:text-gray-300" style={{ fontSize: "0.925rem" }}>{config.description}</p>

                <p className="mt-4 text-gray-500 dark:text-gray-400" style={{ fontSize: "0.82rem" }}>
                  El veredicto se basa en trazabilidad de fuentes externas y reglas de contingencia local.
                </p>
              </div>
            </div>
          </div>

          {/* Preventive alert banner */}
          {shouldShowAlert && (
            <div
              ref={warningBannerRef}
              className={`rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4 mb-5 transition-all ${
                warningPulse ? "ring-2 ring-orange-300 dark:ring-orange-600 shadow-lg" : ""
              }`}
            >
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
          {shouldShowLocalSignals && result.signals.length > 0 && (
            <div className="surface-panel p-5 mb-5">
              <h3 className="text-gray-800 dark:text-gray-100 mb-4" style={{ fontSize: "1rem", fontWeight: 600 }}>
                Señales detectadas
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

          <SourcesCard result={result} />

          {/* Feedback */}
          <div className="surface-panel p-5 mb-5">
            <h3 className="text-gray-800 dark:text-gray-100 mb-2" style={{ fontSize: "1rem", fontWeight: 600 }}>
              ¿Te fue útil esta explicación?
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4" style={{ fontSize: "0.85rem" }}>
              Tu feedback nos ayuda a medir satisfacción e impacto de la plataforma.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setFeedbackVote("helpful")}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                  feedbackVote === "helpful"
                    ? "bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300"
                    : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Útil
              </button>
              <button
                onClick={() => setFeedbackVote("not_helpful")}
                className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                  feedbackVote === "not_helpful"
                    ? "bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"
                    : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Poco útil
              </button>
            </div>

            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Comentario opcional sobre la explicación..."
              className="field resize-none mb-3"
              rows={3}
            />

            <button
              onClick={handleSendFeedback}
              disabled={sendingFeedback}
              className="btn-primary"
            >
              {sendingFeedback ? "Enviando..." : "Enviar feedback"}
            </button>
            {feedbackSent && (
              <p className="mt-3 text-emerald-600 dark:text-emerald-400" style={{ fontSize: "0.85rem" }}>
                Gracias por tu feedback. Tu opinión nos ayuda a mejorar Factify.
              </p>
            )}
          </div>

          {/* Disclaimer */}
          <div className="surface-subtle p-4 mb-6">
            <p className="text-gray-400" style={{ fontSize: "0.78rem", lineHeight: 1.6 }}>
              <strong className="text-gray-500 dark:text-gray-300">Aviso informativo:</strong>{" "}
              Esta clasificación es una estimación técnica apoyada por IA y análisis de procesamiento de lenguaje natural.
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
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border ${
              toastKind === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200"
            }`}
            style={{ fontSize: "0.85rem" }}
          >
            {toastMessage}
          </div>
        </div>
      )}
    </>
  );
}

