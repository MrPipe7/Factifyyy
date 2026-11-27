# A1 · Problema, hipótesis y objetivos medibles (Factify)

**Proyecto:** Factify — Plataforma de verificación de noticias falsas mediante IA y contraste de fuentes  
**MPV desplegado:** https://factifyyy.vercel.app  
**Fuente de código:** repositorio `MrPipe7/Factifyyy`  
**Última actualización:** 2026-11-27

---

## Problema

La desinformación circula más rápido que la verificación. Las personas comparten contenido sin contrastar fuentes accesibles. Afecta a lectores en redes sociales, medios y entornos educativos. La causa raíz identificada en el diagnóstico (Ishikawa, cinco porqués, focus group exploratorio, n=4) es la **falta de herramientas simples** para evaluar una afirmación concreta antes de compartirla.

Factify **no** pretende resolver la desinformación como fenómeno social; aborda el caso de uso: *contrastar una afirmación y entender por qué se clasifica como confiable, dudosa o falsa*.

## Hipótesis

Si los usuarios disponen de una aplicación web que contrasta una afirmación con verificadores publicados, búsqueda web y un juez por API (Gemini), y muestra explicación y fuentes antes de compartir, entonces:

1. Mejorará su capacidad de clasificar noticias de ejemplo (medido antes/después con el mismo formulario).
2. El motor técnico alcanzará exactitud ≥ 85 % en conjuntos de evaluación controlados y no vistos en el ajuste.

## Objetivo general

Entregar un MPV accesible que permita verificar texto (y parcialmente URL/video) y clasificarlo en **Confiable**, **Dudosa** o **Falsa**, con explicación, fuentes y alerta preventiva.

## Objetivos específicos medibles

| ID | Objetivo específico | Métrica | Línea base | Meta | Método de medición | Resultado medido (MPV) | Estado vs meta |
|---|---|---|---|---|---|---|---|
| OE-1 | Precisión del motor de clasificación en noticias controladas | Exactitud (%) sobre conjuntos etiquetados | ~40–50 % solo reglas locales (Sprint 1–2, doc. interno) | ≥ 85 % | `npm run test:evaluation` modo `llm`, splits `holdout` y `final` | **Holdout 90 % (36/40)**; **Final 90 % (27/30)**; macro-F1 ~90 % | **Cumple** |
| OE-2 | Mejorar el acierto del usuario al clasificar noticias de prueba | % de aciertos (usuario) en 2 casos por participante | 63,6 % (14/22 clasificaciones) antes de usar Factify | Mejora respecto de la línea base | Formulario HU17 (Google Forms), n=11, 22 casos | **90,9 % (20/22)** después; 7 corregidas, 1 empeoró; coincidencia con Factify **19/22** | **Cumple** (mejora clara) |
| OE-3 | Utilidad y confianza percibida | Promedio escala Likert 1–5 (utilidad, comprensión, confianza) | Sin medición previa | ≥ 4,0 en utilidad y comprensión | Ítems del mismo formulario HU17 | Utilidad **4,27**; comprensión **4,64**; confianza **4,00**; facilidad **4,91** | **Cumple** en utilidad/comprensión |
| OE-4 | Reducir falsos positivos graves (falsa → confiable) | Conteo FP grave en evaluación técnica | Presente en iteraciones tempranas | 0 casos Falsa etiquetados como Confiable en holdout/final | Matrices en `docs/pruebas/evidencia/eval-*.txt` | **0/22** falsas como Confiable en reportes finales | **Cumple** |
| OE-5 | Disponibilidad del servicio en producción | `GET /api/health` responde 200 | — | 100 % en muestreo manual | 10 solicitudes HTTPS a producción, 2026-11-27 | 10/10 OK; latencia media ~180 ms (health) | **Cumple** (muestra reducida) |

## Validación por stakeholder

| Indicador | Stakeholder | Rol | Fecha | Registro |
|---|---|---|---|---|
| OE-2, OE-3 (prueba con usuarios) | **[COMPLETAR]** | **[COMPLETAR]** (p. ej. profesor guía según acuerdo INSW422) | **[COMPLETAR]** | Comentario en Jira HU17 / FTY-55 y este archivo |
| Objetivos técnicos OE-1, OE-4 | Felipe Figueroa | Desarrollador | 2026-11-26 | Evidencia en `docs/pruebas/evidencia/` commit asociado al informe |

> **Nota:** La guía Hito 3 exige aprobación de un stakeholder **distinto del estudiante** para indicadores medidos con usuarios. Complete la fila antes del tag `hito3`.

## Referencias

- Evidencia evaluación: `docs/pruebas/evidencia/eval-holdout-llm-v3b.txt`, `eval-final-llm-v3b.txt`
- CSV HU17: archivo local del autor (`Prueba de Factify_ ¿te ayuda a reconocer noticias falsas_.csv`)