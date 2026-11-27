# Changelog

Historial del MPV **Factify** por incrementos y HUs. Cada versión enlaza entregas relevantes; el detalle técnico está en los PR de GitHub.

**Evidencia Hito 3 (INSW422):** tag anotado [`hito3`](https://github.com/MrPipe7/Factifyyy/releases/tag/hito3) sobre el merge de documentación ([PR #26](https://github.com/MrPipe7/Factifyyy/pull/26)).

---

## [hito3] — 2026-11-27

Congela la evidencia del MPV para defensa (artefactos A1–A9 en `docs/`).

### Documentación
- `docs/`: objetivos, requerimientos, trazabilidad, pruebas, calidad, ADR (UML), riesgos.
- `README.md` del repositorio alineado a Vercel + Supabase y URL de producción.

---

## [0.3.0] — 2026-11 (Sprint 3)

### Añadido
- HU18: análisis YouTube/Shorts por subtítulos (PR #19–#21).
- HU16: cadena Gemini, caché `llm_cache`, conjuntos holdout/final (PR #18, #23–#24).
- HU15: matriz de confusión y F1 (PR #17).
- HU14: `verificationService` y evaluación local/full (PR #16).
- HU13: dataset ampliado a 100 casos (PR #15).

### Corregido
- Etiquetas de postura en tarjetas de fuentes.
- Regla de coincidencias y política Gemini frente a desmentido cercano (PR #24).

---

## [0.2.0] — 2026-10 (Sprint 2)

### Añadido
- HU06–HU12: Vercel, Supabase, `/api/verify`, fact-check, URL, feedback, historial, tips, refactor.
- `supabase/schema.sql` y políticas RLS.
- Google Fact Check y Tavily.

---

## [0.1.0] — 2026-09 (Sprint 1)

### Añadido
- HU01–HU05: ingreso, análisis local, clasificación, explicación, alerta.
- Frontend React + Vite; motor `shared/analyzer.ts`.