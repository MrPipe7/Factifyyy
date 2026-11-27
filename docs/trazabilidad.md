# A4 · Matriz de trazabilidad (objetivo → evidencia → PR)

**Regla:** cada fila debe poder recorrerse en vivo en defensa. Los **Must** sin prueba ejecutada deben ser 0 antes del tag `hito3` (objetivo de cierre).

**Leyenda Resultado:** Aprobado · Parcial · No hecho  
**Commit referencia (tag `hito3`):** `cc758ae` — ver [`CHANGELOG.md`](../CHANGELOG.md)

---

## Trazabilidad principal (Must / MPV)

| Objetivo | Req | Modelo (UML) | HU | Sprint | Caso prueba | Nivel | Evidencia | Resultado | PR / commit |
|---|---|---|---|---|---|---|---|---|---|
| OE-1 | RF06 | Secuencia verify (`modelos/secuencia-verify.mmd`) | HU16 | 3 | EV-FINAL-01 | Integración / evaluación | `docs/pruebas/evidencia/eval-final-llm-v3b.txt` | Aprobado 90 % | PR #18, `81466dd` |
| OE-1 | RF05 | Secuencia verify | HU09 | 2 | PI-FC-01 | Integración | Manual prod. + `factCheckService.ts` | Aprobado | PR Sprint 2 |
| OE-1 | RF13 | — | HU14 | 3 | EV-HOLDOUT-01 | Evaluación | `eval-holdout-llm-v3b.txt` | Aprobado 90 % | PR #16 |
| OE-2 | RF01 | Secuencia verify | HU01 | 1 | CP-01-01 | Aceptación / manual | Demo prod. | Aprobado | PR #1–#5 (Sprint 1) |
| OE-2 | RF09 | — | HU05 | 1 | CP-05-01 | Manual | `AlertModal` | Aprobado | Sprint 1 |
| OE-2 | RF15 | — | HU07 | 2 | PF-07a | Integración | **[Pendiente registro]** | Parcial | PR HU07 |
| OE-2 | RF16 | — | HU18 | 3 | PF-18-prod | E2E | Fallo YouTube prod. | **Parcial** | PR #19–#21 |
| OE-2, OE-3 | RF07 | Flujo decisión (`modelos/flujo-decision.mmd`) | HU17 | 3 | CP-HU17-01 | Aceptación | CSV formulario + informe | Aprobado medición; **stakeholder pendiente** | FTY-55 |
| OE-4 | RF06 | Flujo decisión | HU16 | 3 | EV-FP-01 | Evaluación | 0 FP Falsa→Confiable | Aprobado | PR #24 |
| Transversal | RNF-04 | Despliegue | HU06 | 2 | CP-RNF-04-01 | Revisión | `.env.example`, Vercel | Aprobado | Infra HU06 |
| Transversal | RNF-05 | Datos (`schema.sql`) | HU06, HU16 | 2–3 | CP-RLS-01 | Integración | `supabase/schema.sql` | Aprobado | commit schema |
| Transversal | RNF-06 | — | HU12 | 2 | — | Revisión código | Estructura repo | Aprobado | Sprint 2 |
| Transversal | RNF-01 | Secuencia verify | HU09 | 2–3 | CP-RNF-01 | Eficiencia | **`docs/calidad/reportes/` k6 pendiente** | **Parcial** | — |
| Transversal | RNF-06 dep | — | — | — | CP-RNF-06 | Seguridad | `npm-audit-2026-11-27.txt` | Aprobado (0 vulns) | — |

---

## Historias del MPV (resumen)

| HU | Título abreviado | Sprint | Jira (FTY) | Resultado | Notas |
|---|---|---|---|---|---|
| HU06 | Infra Vercel + Supabase | 2 | FTY-18 | Aprobado | DDL `supabase/schema.sql` |
| HU07 | URL → texto | 2 | FTY-19 | Aprobado | |
| HU08 | Feedback | 2 | FTY-20 | Aprobado | |
| HU09 | Fact Check + Tavily | 2 | FTY-21 | Aprobado | |
| HU10 | Historial | 2 | FTY-22 | Aprobado | |
| HU11 | Tips | 2 | FTY-23 | Aprobado | |
| HU12 | Refactor capas | 2 | FTY-24 | Aprobado | |
| HU13 | Dataset 100 casos | 3 | FTY-50 | Aprobado | PR #15 |
| HU14 | Evaluación local/API | 3 | FTY-52 | Aprobado | PR #16 |
| HU15 | Matriz confusión | 3 | FTY-53 | Aprobado | PR #17 |
| HU16 | Precisión + Gemini | 3 | FTY-54 | Aprobado | PR #18, #23–#24 |
| HU17 | Prueba usuarios | 3 | FTY-55 | **Parcial** (falta registro stakeholder Jira) | n=11 |
| HU18 | Video subtítulos | 3 | FTY-56 | **Parcial** | Prod. bloqueada |

---

## Riesgos enlazados (ver `docs/riesgos.md`)

| Riesgo | Amenaza a |
|---|---|
| E-01 Error red Fact Check propagado | RF05, OE-1 |
| E-02 Gemini sin respuesta FC | RF06, documentación vs código |
| R-YouTube bloqueo | RF16, HU18 |

---

## Controles antes de `hito3`

1. Must sin prueba: cerrar **CP-RNF-01** (carga) o declarar en deuda con motivo.
2. HU Hecha sin aprobación stakeholder: completar **HU17** en Jira.
3. Coherencia código/documentación: Gemini solo si `factCheckResult` (`verificationService.ts` L371).