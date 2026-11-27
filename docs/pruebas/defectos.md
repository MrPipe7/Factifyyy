# Registro de defectos

| ID | Defecto | Severidad | Req/HU | Corrección | Verificación | Estado |
|---|---|---|---|---|---|---|
| D-01 | Insert `verifications_log` bloqueado por RLS | Alta | HU06, HU08 | Políticas en `supabase/schema.sql` | verify devuelve `verificationId` | Cerrado |
| D-02 | Fuente Yelp/Facebook contaban como respaldo | Alta | HU09, OE-4 | Filtro dominios + relevancia términos | Evaluación holdout | Cerrado (PR #16–#18) |
| D-03 | Gemini podía anular desmentido cercano → Confiable | Alta | HU16 | PR #24 `fix-regla-coincidencias` | Eval final + regresión manual | Cerrado |
| D-04 | YouTube subtítulos en producción Vercel | Media | HU18, RF16 | Clientes alternativos; mensaje UI | PF-18-prod falla | **Abierto** |
| D-05 | Sin suite automatizada en CI | Media | RNF-07 | DT-01 en `docs/riesgos.md` | — | Abierto |
| D-06 | Documentación “Gemini siempre” vs código condicional | Baja | E-02 | Alinear `docs/` y diagramas | Revisión trazabilidad | En corrección |
| D-07 | Meta HU17 20 % compartir no medible | Baja | HU17 | Declarar no evaluable en informe | — | Cerrado (alcance) |

## Deuda técnica vinculada (DT)

Ver `docs/riesgos.md` § Deuda técnica.