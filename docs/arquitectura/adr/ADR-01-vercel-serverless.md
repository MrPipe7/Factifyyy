# ADR-01: Despliegue serverless en Vercel

**Estado:** Aceptada  
**Fecha:** 2026-10 (Sprint 2, HU06)

## Contexto

RF01–RF09 y RNF-01 exigen MPV accesible en internet sin administrar servidores (proyecto de título, costo cero). El frontend es estático; la API son pocos endpoints Node/TypeScript.

## Alternativas

1. **Vercel** (serverless + CDN frontend).
2. **Servidor VPS** (Node + nginx).
3. **PaaS tradicional** (Railway, Render con proceso always-on).

## Matriz de decisión (1–5)

| Criterio | Peso | Vercel | VPS | PaaS always-on |
|---|---:|---:|---:|---:|
| Costo cero / tier gratuito | 30 % | 5 | 2 | 3 |
| Integración CI desde GitHub | 25 % | 5 | 3 | 4 |
| Escalado sin ops (RNF-03) | 25 % | 4 | 2 | 4 |
| Límite 30 s funciones (RNF-01) | 20 % | 3 | 5 | 5 |
| **Ponderado** | 100 % | **4,35** | **2,65** | **3,85** |

## Decisión

**Vercel** con funciones en `api/` y build del frontend.

## Consecuencias

- Timeout 30 s: cadena Gemini con presupuesto acotado.
- Variables de entorno por proyecto; redeploy al cambiar secretos.
- README debe documentar `vercel dev` y URL de producción.