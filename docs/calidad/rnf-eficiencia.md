# RNF · Eficiencia (A2 + A6)

## Escenario RNF-01 — `POST /api/verify`

| Campo | Valor |
|---|---|
| Fuente | Usuario concurrente |
| Estímulo | POST JSON `{ "text": "<afirmación ~200 caracteres>" }` |
| Entorno | Producción `https://factifyyy.vercel.app` |
| Respuesta | HTTP 200, cuerpo con `classification` |
| Medida | p95 latencia ≤ **25 s**; tasa fallo &lt; **1 %** (límite función Vercel 30 s) |
| Herramienta | **k6** (recomendada por guía Hito 3) |

### Estado

| Medida pedida | Resultado | Evidencia |
|---|---|---|
| p95 verify ≤ 25 s, errores &lt; 1 % | **Pendiente** | Ejecutar script `reportes/k6-verify.js.example` y guardar salida en `reportes/k6-verify-AAAA-MM-DD.txt` |
| Health p95 ≤ 2 s | Muestra manual 2026-11-27: avg **180 ms**, max **960 ms**, n=10 | `reportes/health-latency-2026-11-27.txt` |

### Observaciones

- Con caché LLM (`llm_cache`), respuestas repetidas pueden ser &lt; 2 s.
- Sin caché y con Gemini + Tavily + FC, tiempos observados en desarrollo entre ~3 s y ~17 s (informe Sprint 3).

### Cómo reproducir health (PowerShell)

```powershell
# Generar reporte simple (ajustar n)
1..20 | ForEach-Object { Measure-Command { Invoke-WebRequest https://factifyyy.vercel.app/api/health -UseBasicParsing } }
```

### Cómo reproducir carga verify (k6)

Ver ejemplo en `docs/calidad/reportes/k6-verify.js.example` y documentar fecha + commit en el nombre del reporte.