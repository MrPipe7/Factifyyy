# Informe de resultados de pruebas

**Fecha:** 2026-11-27  
**Commit referencia:** `26dd1ff`  
**Ambiente evaluación técnica:** local con APIs y caché LLM v3; producción para health y pruebas manuales.

---

## Resumen

| Tipo | Qué se probó | Resultado | Qué significa |
|---|---|---|---|
| Evaluación (sistema) | 100 casos etiquetados, modo `llm` | Holdout **90 %**; Final **90 %**; 0 FP Falsa→Confiable | OE-1 cumple meta ≥ 85 %; errores restantes Dudosa→Falsa (rumores) |
| Integración manual | verify, feedback, health en prod. | Operativo con degradación si APIs fallan | RNF-03 implementado |
| Aceptación HU17 | 11 usuarios, 22 clasificaciones | Acierto usuario +27,3 pp; percepción alta | OE-2 y OE-3 cumplen; falta firma stakeholder |
| Unitaria automatizada | Validación y reglas (parcial) | Ejecutada en carpeta opcional, **no en CI** | Cobertura &lt; 70 % → deuda DT-01 |
| Eficiencia | `/api/health` n=10 | avg 180 ms, max 960 ms | RNF-02 cumple en health; verify sin p95 formal |
| Seguridad deps | `npm audit` raíz | **0 vulnerabilidades** | RNF-06 cumple en auditoría npm |

---

## Evaluación técnica (detalle)

Fuente: `docs/pruebas/evidencia/eval-final-llm-v3b.txt`, `eval-holdout-llm-v3b.txt`.

- **Final (27/30):** macro-F1 89,8 %; 3 errores Dudosa→Falsa (mensajes reenviados / producto milagro).
- **Holdout (36/40):** macro-F1 90,1 %; 4 errores mismo patrón.
- **Decisión:** aceptable para MPV; riesgo conocido en rumores sin confirmar → priorizar explicación “Dudosa” (HU16 parcial futuro).

Comando reproducible:

```bash
npm run test:evaluation -- --split final --mode llm
```

(Requiere variables en `.env.local` y cuota APIs.)

---

## Prueba con usuarios (HU17)

- **n = 11**, 2 noticias por persona → **22** clasificaciones.
- Exactitud usuario: **63,6 %** (14/22) → **90,9 %** (20/22).
- Coincidencia clasificación final con Factify: **19/22**.
- Percepción (1–5): facilidad 4,91; comprensión 4,64; confianza 4,00; utilidad 4,27; usaría antes de compartir 4,36.

**Limitación:** no se midió intención de compartir con meta 20 % (ítem no incluido en formulario).

---

## Casos no ejecutados (con motivo)

| Caso | Motivo |
|---|---|
| CP-RNF-01 (carga verify) | Falta ejecución k6 archivada → ver `docs/calidad/rnf-eficiencia.md` |
| PF-07a–d | Matriz URL formal pendiente documentar en repo |
| PF-18-prod | Bloqueo YouTube en IP serverless |
| Suite unitaria completa | Tests no integrados en `tests/` + CI |

---

## Conclusión para Hito 3

El núcleo funcional y la precisión técnica están **respaldados**. Antes del tag `hito3`: (1) reporte k6, (2) stakeholder HU17 en Jira, (3) migrar tests opcionales o justificar deuda en plan.