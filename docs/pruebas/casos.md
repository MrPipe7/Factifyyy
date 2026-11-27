# Casos de prueba (extracto MPV)

IDs enlazados a `docs/trazabilidad.md`. Formato estándar para ampliar.

---

## Evaluación técnica

| ID | Req | HU | Tipo | Precondición | Pasos | Esperado | Evidencia |
|---|---|---|---|---|---|---|---|
| EV-HOLDOUT-01 | RF13 | HU16 | Sistema | Dataset holdout, modo llm | `npm run test:evaluation -- --split holdout --mode llm` | Exactitud ≥ 85 % | `evidencia/eval-holdout-llm-v3b.txt` |
| EV-FINAL-01 | RF13 | HU16 | Sistema | Dataset final | Idem `split=final` | Exactitud ≥ 85 % | `evidencia/eval-final-llm-v3b.txt` |

---

## Funcionales / API

| ID | Req | Tipo | Pasos | Esperado | Estado |
|---|---|---|---|---|---|
| CP-01-01 | RF01 | Positivo | POST verify texto 50 chars válido | 200 + classification | Aprobado |
| CP-02-01 | RF02 | Negativo | POST verify texto 5 chars | 400 | Aprobado |
| CP-02-02 | RF02 | Negativo | POST verify > 10000 chars | 413 | Aprobado |
| PI-FC-01 | RF05 | Integración | Texto con ClaimReview conocido | Fuente verificador + clasificación coherente | Aprobado manual |
| CP-08-01 | RF08 | Positivo | Verificar + enviar feedback helpful | 201 + fila feedback | Aprobado (con RLS) |
| PF-07a | RF15 | Positivo | POST analyze-url medio abierto | Texto extraído | Por ejecutar formal |
| PF-18-prod | RF16 | Negativo | URL YouTube en prod. | Subtítulos o mensaje controlado | **Fallido** (bloqueo) |

---

## No funcionales

| ID | RNF | Tipo | Pasos | Esperado | Estado |
|---|---|---|---|---|---|
| CP-RNF-04-01 | RNF-04 | Revisión | Buscar claves en git | 0 secrets | Aprobado |
| CP-RLS-01 | RNF-05 | Integración | Insert verify sin políticas | Sin RLS: error; con schema: verificationId | Aprobado |
| CP-RNF-01 | RNF-01 | Carga | k6 50 VU POST /api/verify | p95 ≤ 25 s, errores < 1 % | **Pendiente** |
| CP-RNF-06 | RNF-06 | Seguridad | `npm audit` | 0 high/critical | Aprobado 2026-11-27 |

---

## Aceptación HU17

| ID | HU | Tipo | Descripción | Esperado | Resultado |
|---|---|---|---|---|---|
| CP-HU17-01 | HU17 | Aceptación | 11 usuarios, 2 noticias c/u, antes/después | Mejora acierto usuario | 63,6 % → 90,9 % |
| CP-HU17-02 | HU17 | Aceptación | Escala percepción 1–5 | Promedios ≥ 4 en utilidad | 4,27 utilidad |

**Aprobación stakeholder en ticket:** **[COMPLETAR]**