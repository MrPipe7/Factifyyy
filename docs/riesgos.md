# A9 · Riesgos y deuda técnica

**Última revisión:** 2026-11-27

## Matriz de riesgos

| ID | Riesgo | Prob. | Impacto | Nivel | Req / OE afectado | Mitigación | Contingencia | Estado al cierre |
|---|---|---|---|---|---|---|---|---|
| R-01 | Cuota agotada Gemini/Tavily | Media | Alto | Alto | OE-1, RF05 | Caché `llm_cache`, modo evaluación con caché | Degradar a reglas/fuentes | Cerrado parcial (ocurrió en dev) |
| R-02 | Timeout función 30 s Vercel | Media | Medio | Medio | RNF-01 | Cadena modelos, timeouts 8/18 s | Resultado sin LLM | Cerrado |
| R-03 | YouTube bloquea IP serverless | Alta | Medio | Alto | RF16, HU18 | Headers, clientes alternativos | Pegar texto manual | **Materializado** |
| R-04 | RLS mal configurado | Media | Alto | Alto | HU08 | `schema.sql` versionado | Mensaje `storageError` | Cerrado |
| R-05 | Falsos positivos Confiable | Media | Alto | Alto | OE-4 | PR #24, filtros fuentes | Marcar Dudosa | Cerrado |
| E-01 | Error red Fact Check deriva clasificación incorrecta | Media | Medio | Medio | RF05 | Manejo errores en `factCheckService` | Solo reglas | Abierto |
| E-02 | Sin Fact Check no hay Gemini (brecha documentación) | Alta | Bajo | Medio | RF06 | Alinear docs y diagramas | — | En mitigación |

## Deuda técnica priorizada

| ID | Deuda | Impacto | Plan |
|---|---|---|---|
| DT-01 | Sin suite automatizada en `tests/` ni CI | Alto | Migrar tests opcionales; reporte en `docs/pruebas/` |
| DT-02 | Prueba carga k6 no archivada | Medio | Ejecutar `k6-verify.js.example` antes de `hito3` |
| DT-03 | README raíz desactualizado (habla de solo local) | Medio | Actualizar README con MPV cloud |
| DT-04 | E2E HU18 en producción | Medio | Documentar Parcial; RF16 en trazabilidad |
| DT-05 | Aprobación stakeholder HU17 no en Jira | Medio | Comentario formal en FTY-55 |
| DT-06 | Subtareas Jira documentación abiertas | Bajo | Cerrar o mover a post-hito3 |

## Plan de mejoras (post-MPV)

1. Completar k6 y publicar en `docs/calidad/reportes/`.
2. Tag `hito3` (evidencia congelada en GitHub).
3. HU19 o mejoras Dudosa→Falsa solo con evidencia en holdout.
4. HU18: proxy o ingestión manual de subtítulos en prod.