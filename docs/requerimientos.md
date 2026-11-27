# A2 · Requerimientos, alcance del MPV y escenarios de calidad

**Última actualización:** 2026-11-27  
**Trazabilidad:** ver `docs/trazabilidad.md`

---

## Requerimientos funcionales (MPV)

| ID | Descripción | Tipo | Prioridad | Objetivo | Estado |
|---|---|---|---|---|---|
| RF01 | Ingresar texto noticioso (20–10.000 caracteres) | Funcional | Must | OE-2 | Implementado |
| RF02 | Validar vacío, longitud mínima y máxima | Funcional | Must | OE-5 | Implementado |
| RF03 | Motor de reglas lingüísticas locales | Funcional | Must | OE-1 | Implementado |
| RF04 | Detectar señales de desinformación | Funcional | Must | OE-1 | Implementado |
| RF05 | Consultar Google Fact Check y Tavily | Funcional | Must | OE-1 | Implementado |
| RF06 | Clasificar en confiable, dudoso, falso | Funcional | Must | OE-1, OE-4 | Implementado |
| RF07 | Mostrar clasificación, explicación y señales (sin porcentaje de confianza) | Funcional | Must | OE-2, OE-3 | Implementado |
| RF08 | Mostrar fuentes y origen del análisis | Funcional | Should | OE-3 | Implementado |
| RF09 | Alerta preventiva si resultado dudoso o falso | Funcional | Must | OE-2 | Implementado |
| RF10 | Historial local de verificaciones | Funcional | Should | OE-2 | Implementado |
| RF11 | Registrar eventos de uso en servidor | Funcional | Could | — | Parcial (`verifications_log`) |
| RF12 | Estadísticas agregadas de utilización | Funcional | Could | — | No implementado |
| RF13 | Evaluación técnica con conjuntos etiquetados | Funcional | Must | OE-1 | Implementado |
| RF14 | Métricas: exactitud, matriz, F1 | Funcional | Must | OE-1 | Implementado |
| RF15 | Análisis por URL de artículo | Funcional | Should | OE-2 | Implementado |
| RF16 | Análisis por subtítulos de video YouTube/Shorts | Funcional | Should | OE-2 | **Parcial** (bloqueo en prod.) |
| RF17 | Extraer texto desde URL | Funcional | Should | OE-2 | Implementado |
| RF18 | Transcripción automática de audio | Funcional | Won't (MPV) | — | Excluido |

---

## Requerimientos no funcionales (escenarios medibles)

### RNF-01 · Eficiencia — verificación de texto

| Parte | Contenido |
|---|---|
| **Fuente** | Usuario final en producción |
| **Estímulo** | `POST /api/verify` con texto de ~200 caracteres, sin caché LLM |
| **Entorno** | https://factifyyy.vercel.app, función serverless (límite Vercel 30 s) |
| **Respuesta** | JSON 200 con clasificación |
| **Medida de respuesta** | p95 ≤ 25 s; errores HTTP 5xx &lt; 1 % en prueba de carga documentada |
| **Estado** | **Parcial:** salud medida (`/api/health`); p95 de verify **pendiente** reporte k6 → `docs/calidad/rnf-eficiencia.md` |

### RNF-02 · Eficiencia — health check

| Parte | Contenido |
|---|---|
| **Estímulo** | `GET /api/health` |
| **Medida** | p95 ≤ 2 s (muestreo manual 2026-11-27: min 86 ms, max 960 ms, avg 180 ms, n=10) |
| **Estado** | **Cumple** en muestra reducida |

### RNF-03 · Disponibilidad / degradación

| Parte | Contenido |
|---|---|
| **Estímulo** | Fallo o timeout de APIs externas |
| **Respuesta** | Clasificación por reglas locales o balance de fuentes sin caída total |
| **Medida** | 0 respuestas 500 por fallo de Tavily/FC controlado (casos en `docs/pruebas/casos.md`) |
| **Estado** | Implementado; CP integración **parcialmente** ejecutados |

### RNF-04 · Seguridad — secretos

| Parte | Contenido |
|---|---|
| **Estímulo** | Revisión de repositorio y despliegue |
| **Respuesta** | Claves solo en Vercel / `.env.local`; `.env` en `.gitignore` |
| **Medida** | 0 claves en historial git (revisión manual) |
| **Estado** | **Cumple** |

### RNF-05 · Seguridad — persistencia Supabase (RLS)

| Parte | Contenido |
|---|---|
| **Estímulo** | Cliente con `SUPABASE_ANON_KEY` inserta en `verifications_log` |
| **Respuesta** | Insert/select permitidos según políticas; sin exposición de datos de terceros |
| **Medida** | Políticas en `supabase/schema.sql`; 0 accesos anónimos a tablas no documentadas |
| **Estado** | **Cumple** (esquema versionado) |

### RNF-06 · Seguridad — dependencias

| Parte | Contenido |
|---|---|
| **Estímulo** | `npm audit` en raíz del proyecto |
| **Medida** | 0 vulnerabilidades críticas/altas abiertas |
| **Estado** | **Cumple** (2026-11-27, ver `docs/calidad/reportes/npm-audit-2026-11-27.txt`) |

### RNF-07 · Mantenibilidad

| Parte | Contenido |
|---|---|
| **Medida** | Capas `api/`, `backend/services/`, `shared/`; tipado TypeScript |
| **Estado** | **Cumple** (HU12) |

---

## Alcance del MPV

| Elemento | Decisión | Justificación |
|---|---|---|
| Verificación por texto + APIs + Gemini condicional | **Incluido** | Núcleo OE-1, OE-4 |
| URL de artículo | **Incluido** | OE-2 |
| Video YouTube por subtítulos | **Incluido parcial** | HU18; falla en producción (YouTube) |
| Feedback útil/poco útil | **Incluido** | HU08, mejora continua |
| Historial y consejos (Tips) | **Incluido** | HU10, HU11 |
| Prueba con usuarios HU17 | **Incluido** | OE-2, OE-3 |
| Modelo ML propio (HU19) | **Excluido** | Fuera de tiempo y datos |
| Transcripción de audio (RF18) | **Excluido** | Sin API gratuita fiable |
| Porcentaje de confianza numérico | **Excluido** | CAM-05: baja interpretabilidad |
| Meta “20 % menos intención de compartir” en formulario | **No medido** | El formulario HU17 no incluyó ese ítem |