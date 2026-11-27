# A5 · Plan de pruebas

**Versión del plan:** 1.0  
**Fecha:** 2026-11-27 (pre-ejecución formal Hito 3)  
**Alcance:** MPV Factify en https://factifyyy.vercel.app y código en `main`.

---

## Objetivo del plan

Verificar que los requerimientos **Must** del MPV se cumplen, con evidencia reproducible y ligada a commits.

## Niveles de prueba

| Nivel | Alcance | Herramienta | Responsable |
|---|---|---|---|
| Unitaria | `shared/validateInput.ts`, reglas en `shared/analyzer.ts`, utilidades puras | Manual + scripts opcionales (`Informe-Sprint3/evidencia/pruebas-opcionales/*.test.ts` — **migrar a `tests/`**) | Desarrollador |
| Integración | `/api/verify`, `/api/analyze-url`, `/api/feedback`, Supabase | Manual, `vercel dev`, producción | Desarrollador |
| Evaluación / sistema | Conjuntos `holdout`, `final`, `all` | `npm run test:evaluation` | Desarrollador |
| E2E | Flujos UI: texto → resultado → alerta → feedback | Manual en navegador | Desarrollador |
| Aceptación | Criterios HU + HU17 usuarios | Formulario + demo stakeholder | Stakeholder + desarrollador |

## Criterios de entrada

- Build frontend OK (`npm run build`).
- Variables en Vercel o `.env.local` para entornos con APIs.
- DDL Supabase aplicado (`supabase/schema.sql`).

## Criterios de salida (MPV Hito 3)

- Todos los **Must** con al menos un caso **ejecutado** y resultado en `informe-resultados.md`.
- 0 defectos **críticos** abiertos.
- Casos no ejecutados listados en `defectos.md` o `docs/riesgos.md` (deuda DT-*) con motivo.
- Objetivo de cumplimiento del plan: **≥ 80 %** casos planificados (meta guía: 95 %).

## Resumen planificado vs ejecutado (cierre preliminar)

| Nivel | Planificados | Ejecutados | No ejecutados |
|---|---:|---:|---|
| Unitaria | 15 | 8 | 7 (sin suite CI) |
| Integración | 22 | 14 | 8 |
| Evaluación | 4 | 4 | 0 |
| E2E | 8 | 5 | 3 (HU18 prod., cancelación, etc.) |
| Aceptación | 6 | 5 | 1 (aprobación stakeholder HU17) |
| **Total** | **55** | **36** | **19 (~65 %)** |

> **Deuda:** subir tests a `tests/` y automatizar reporte para subir cumplimiento antes del tag `hito3`.

## Referencias

- Casos: `docs/pruebas/casos.md`
- Defectos: `docs/pruebas/defectos.md`
- Resultados: `docs/pruebas/informe-resultados.md`
- Evidencia cruda: `docs/pruebas/evidencia/`