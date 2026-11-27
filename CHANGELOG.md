# Changelog

Formato basado en historias de usuario y PRs enlazados. Versiones previas al MPV cloud en tag Sprint 1–2.

## [Unreleased] — pre `hito3`

### Documentación
- Estructura Hito 3: `docs/` (objetivos, requerimientos, trazabilidad, pruebas, calidad, arquitectura, riesgos).

### Corregido
- Etiquetas de postura en fuentes (`26dd1ff`).
- Regla coincidencias / Gemini vs desmentido (PR #24).

## [0.3.0] — Sprint 3 (2026-11)

### Añadido
- HU18: análisis YouTube/Shorts por subtítulos (PR #19–#21).
- HU16: cadena Gemini, caché `llm_cache`, datasets holdout/final (PR #18, #23).
- HU15: matriz confusión y F1 (PR #17).
- HU14: `verificationService` + evaluación local/full (PR #16).
- HU13: dataset ampliado (PR #15).

## [0.2.0] — Sprint 2 (2026-10)

### Añadido
- HU06–HU12: Vercel, Supabase, `/api/verify`, fact-check, URL, feedback, historial, tips, refactor.
- `supabase/schema.sql` + políticas RLS.
- Integración Google Fact Check y Tavily.

## [0.1.0] — Sprint 1 (2026-09)

### Añadido
- HU01–HU05: ingreso, análisis local, clasificación, explicación, alerta.
- Frontend React + Vite; motor `shared/analyzer.ts`.

---

**Próximo paso:** crear tag anotado `hito3` en el commit que congela esta evidencia (guía INSW422).