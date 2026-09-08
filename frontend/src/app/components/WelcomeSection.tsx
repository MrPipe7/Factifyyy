import { ArrowRight, CheckCircle, Shield, XCircle, AlertTriangle } from "../../components/Icons";

interface WelcomeSectionProps {
  onStart: () => void;
}

export function WelcomeSection({ onStart }: WelcomeSectionProps) {
  return (
    <section className="factify-welcome mb-12">
      <div className="factify-welcome-grid">
        <div className="factify-welcome-copy">
          <div className="factify-badge mb-4 factify-enter factify-enter-d1">
            <Shield className="w-4 h-4" />
            Bienvenido a Factify
          </div>

          <h1 className="factify-welcome-title factify-enter factify-enter-d2">
            Tu aliado contra la{" "}
            <span className="factify-hero-accent">desinformación</span>
          </h1>

          <p className="factify-welcome-lead factify-enter factify-enter-d3">
            Antes de reenviar o compartir una noticia sospechosa, analiza su nivel de confiabilidad.
            Factify procesa el texto mediante inteligencia artificial y procesamiento de lenguaje natural (NLP) para advertirte sobre posibles noticias falsas.
          </p>

          <ul className="factify-welcome-points factify-enter factify-enter-d4">
            {[
              "Ingresa noticias y textos sospechosos en formato texto",
              "Detección automática de lenguaje alarmista, clickbait y ausencia de fuentes",
              "Alerta preventiva inmediata si el contenido es dudoso o falso",
            ].map((point) => (
              <li key={point}>
                <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 mt-8 factify-enter factify-enter-d5">
            <button type="button" onClick={onStart} className="btn-primary">
              Comenzar verificación
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex flex-wrap gap-2">
              <span className="factify-welcome-pill factify-welcome-pill--green">
                <CheckCircle className="w-3.5 h-3.5" />
                Confiable
              </span>
              <span className="factify-welcome-pill factify-welcome-pill--amber">
                <AlertTriangle className="w-3.5 h-3.5" />
                Dudoso
              </span>
              <span className="factify-welcome-pill factify-welcome-pill--red">
                <XCircle className="w-3.5 h-3.5" />
                Falso
              </span>
            </div>
          </div>
        </div>

        <div className="factify-welcome-preview factify-enter factify-enter-scale factify-enter-d3" aria-hidden="true">
          <div className="factify-welcome-preview-glow" />
          <div className="surface-panel surface-panel-accent factify-welcome-preview-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="factify-logo-mark w-10 h-10">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="factify-section-label mb-0.5">Ejemplo de resultado</p>
                <p className="text-gray-800 dark:text-gray-100" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  Análisis NLP completado
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-700 dark:text-amber-300" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  DUDOSO · 72%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-amber-200/80 dark:bg-amber-900/50 overflow-hidden">
                <div className="h-full w-[72%] rounded-full bg-amber-500" />
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>
              Se identificaron señales de lenguaje alarmista y ausencia de fuentes verificables. Se recomienda contrastar antes de compartir.
            </p>

            <div className="flex flex-col gap-2">
              <p className="factify-section-label">Señales evaluadas</p>
              {["Lenguaje alarmista", "Atribución vaga de fuentes", "Uso de mayúsculas enfáticas"].map((signal, i) => (
                <div key={signal} className="flex items-center gap-2 text-gray-600 dark:text-gray-300" style={{ fontSize: "0.78rem" }}>
                  <span className="w-5 h-5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center justify-center" style={{ fontSize: "0.65rem", fontWeight: 700 }}>
                    {i + 1}
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

