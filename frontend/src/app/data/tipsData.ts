export type TipsCategory = "sesgos" | "clickbait" | "fuentes";

export interface TipItem {
  id: string;
  category: TipsCategory;
  title: string;
  description: string;
  action: string;
}

export const tipsData: TipItem[] = [
  {
    id: "sesgos-1",
    category: "sesgos",
    title: "Cuidado con el sesgo de confirmacion",
    description: "Cuando una noticia coincide con lo que ya crees, es mas facil aceptarla sin revisar.",
    action: "Busca al menos una fuente que piense distinto antes de compartir.",
  },
  {
    id: "sesgos-2",
    category: "sesgos",
    title: "No te quedes con el primer impacto",
    description: "Una frase fuerte puede activar una reaccion emocional y nublar el analisis.",
    action: "Espera 30 segundos, relee el texto y revisa si entrega datos verificables.",
  },
  {
    id: "sesgos-3",
    category: "sesgos",
    title: "Distingue opinion de hecho",
    description: "Muchas publicaciones mezclan interpretaciones con afirmaciones que parecen datos.",
    action: "Marca que parte es opinion y que parte afirma un hecho comprobable.",
  },
  {
    id: "clickbait-1",
    category: "clickbait",
    title: "Titulos alarmistas no son evidencia",
    description: "Expresiones como 'impactante', 'urgente' o 'no te lo cuentan' buscan reaccion inmediata.",
    action: "Abre la nota completa y verifica si entrega fuentes concretas.",
  },
  {
    id: "clickbait-2",
    category: "clickbait",
    title: "Sospecha de mayusculas y exageraciones",
    description: "El uso excesivo de mayusculas, signos y frases extremas suele indicar baja calidad informativa.",
    action: "Contrasta el mismo tema en medios reconocidos con tono neutral.",
  },
  {
    id: "clickbait-3",
    category: "clickbait",
    title: "Revisa promesas absolutas",
    description: "Frases como 'siempre', 'nunca' o 'la verdad definitiva' simplifican en exceso temas complejos.",
    action: "Busca contexto: fecha, lugar, fuente y metodologia del dato.",
  },
  {
    id: "fuentes-1",
    category: "fuentes",
    title: "Prioriza fuentes primarias",
    description: "Una fuente primaria publica el documento, estudio o declaracion original.",
    action: "Si solo hay capturas o citas sin enlace, considera el contenido incompleto.",
  },
  {
    id: "fuentes-2",
    category: "fuentes",
    title: "Verifica fecha y contexto",
    description: "Una noticia real puede volverse engañosa si se comparte fuera de contexto temporal.",
    action: "Confirma la fecha de publicacion y si el hecho sigue vigente.",
  },
  {
    id: "fuentes-3",
    category: "fuentes",
    title: "Busca corroboracion independiente",
    description: "Un hecho relevante suele aparecer en mas de un medio confiable.",
    action: "Encuentra dos o mas referencias independientes antes de concluir.",
  },
];
