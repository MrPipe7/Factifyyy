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
            Verifica una noticia en segundos
          </h1>

          <p className="factify-welcome-lead factify-enter factify-enter-d3">
            Antes de compartir una noticia, revisa si parece confiable, dudosa o falsa con una explicación simple.
          </p>

          <ul className="factify-welcome-points factify-enter factify-enter-d4">
            {[
              "Pega el texto de una noticia o un enlace web",
              "Recibe una clasificación clara y fácil de entender",
              "Obtén una alerta antes de compartir contenido riesgoso",
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
                  Análisis completado
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-700 dark:text-amber-300" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  DUDOSO
                </span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>
              Se detectaron señales de riesgo y falta de respaldo claro. Recomendamos verificar antes de compartir.
            </p>

            <div className="flex flex-col gap-2">
              <p className="factify-section-label">Qué revisamos</p>
              {["Fuentes citadas", "Coherencia del contenido", "Señales de alerta"].map((signal, i) => (
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

