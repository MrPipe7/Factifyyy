# ADR-03: Gemini API como juez (en lugar de modelo ML propio)

**Estado:** Aceptada (con limitación E-02 documentada)  
**Fecha:** 2026-11 (Sprint 3, HU16)

## Contexto

OE-1 exige subir exactitud sobre noticias reales. Las reglas solas (~40–50 %) no bastan. HU19 (ML propio) queda fuera del alcance por datos y tiempo.

## Alternativas

1. **Gemini (API)** como juez sobre afirmación + fuentes.
2. **Modelo propio** (BERT/distil) entrenado en dataset del proyecto.
3. **Solo heurísticas + balance de fuentes** (sin LLM).

## Matriz (1–5)

| Criterio | Peso | Gemini API | ML propio | Solo heurísticas |
|---|---:|---:|---:|---:|
| Exactitud en holdout (RF13) | 40 % | 4 | 2* | 2 |
| Tiempo de implementación | 25 % | 5 | 1 | 5 |
| Costo / tier gratuito | 20 % | 4 | 3 | 5 |
| Explicabilidad al usuario | 15 % | 4 | 2 | 3 |
| **Ponderado** | 100 % | **4,25** | **1,85** | **3,20** |

\*Sin entrenamiento realizado; puntaje conservador.

## Decisión

**Gemini** vía `llmVerificationService.ts`, con caché en `llm_cache` y cadena de modelos de respaldo.

**Implementación actual:** el juez se llama solo si la consulta Fact Check/Tavily devolvió `factCheckResult` (`verificationService.ts`). Sin respuesta de FC → sin Gemini (deuda E-02).

## Consecuencias

- Dependencia de cuotas y latencia externa.
- Texto del usuario sale del perimeter hacia Google.
- Evaluación debe usar modo `llm` y declarar limitación cuando APIs fallan.