# Factify — Plataforma de verificación de noticias mediante IA y contraste de fuentes

[![Producción](https://img.shields.io/badge/demo-factifyyy.vercel.app-646CFF?style=flat-square)](https://factifyyy.vercel.app)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)

**Factify** ayuda a contrastar afirmaciones noticiosas **antes de compartirlas**. El usuario ingresa texto, un enlace a un artículo o un video de YouTube; el sistema devuelve una clasificación (**confiable**, **dudoso** o **falso**), una explicación en lenguaje claro, las fuentes consultadas y, si corresponde, una alerta preventiva.

No sustituye el criterio humano ni el trabajo de un periodista: **acorta el camino** entre una afirmación dudosa y evidencia externa verificable.

| | |
|---|---|
| **Demostración** | [https://factifyyy.vercel.app](https://factifyyy.vercel.app) |
| **Contexto** | Proyecto de título — U. Andrés Bello, Escuela de Ingeniería en Computación e Informática, 2026 |
| **Autor** | Felipe Figueroa |
| **Evidencia académica (Hito 3)** | Carpeta [`docs/`](docs/README.md) · tag [`hito3`](https://github.com/MrPipe7/Factifyyy/releases/tag/hito3) · [CHANGELOG](CHANGELOG.md) |

---

## Problema y propuesta

La desinformación se difunde más rápido que la verificación. Muchas personas comparten sin contrastar. Factify aborda un caso concreto: **evaluar una afirmación puntual** con reglas transparentes, verificadores publicados (ClaimReview), búsqueda web y, cuando hay contexto de Fact Check, un **juez por API (Gemini)** que lee la afirmación junto a extractos de fuentes.

El producto evolucionó desde un prototipo **solo local** (Sprint 1) hacia un **MPV en la nube** (Sprints 2–3): Vercel, Supabase, APIs externas y conjuntos de evaluación con ~**90 %** de exactitud en splits controlados (*holdout* / *final*).

---

## Funcionalidades principales

| Área | Qué ofrece |
|------|------------|
| **Verificación por texto** | Análisis de 20 a 10.000 caracteres con validación y mensajes de error claros (400/413). |
| **Verificación por URL** | Extracción de contenido de artículos; ingreso manual si el sitio bloquea el scraping. |
| **Video (YouTube / Shorts)** | Análisis a partir de **subtítulos** cuando existen; aviso si no hay texto utilizable (limitaciones en producción documentadas en `docs/riesgos.md`). |
| **Tres niveles** | Confiable, dudoso, falso — **sin porcentaje de confianza** (decisión basada en evidencia y reglas, no en un número opaco). |
| **Transparencia** | Fuentes con enlace, señales lingüísticas detectadas y **origen del análisis** (local, verificador, balance de fuentes, etc.). |
| **Alerta preventiva** | Modal antes de tratar como seguro un contenido dudoso o falso. |
| **Feedback** | Voto útil / poco útil ligado al registro de verificación en Supabase. |
| **Historial** | Verificaciones recientes en el navegador (sin cuenta de usuario). |
| **Tips** | Consejos de alfabetización mediática (sesgos, clickbait, fuentes). |
| **Evaluación interna** | Scripts y datasets en `data/` para medir exactitud y matriz de confusión. |

---

## Cómo decide el sistema (resumen)

Pipeline en `backend/services/verificationService.ts` (detalle en [`docs/arquitectura/`](docs/arquitectura/README.md)):

1. **Reglas locales** — señales de lenguaje (alarmismo, clickbait, falta de fuentes, etc.) en `shared/analyzer.ts`.
2. **Google Fact Check Tools** — coincidencia con afirmaciones ya verificadas (umbral de similitud ~0,75).
3. **Tavily** — fuentes de contexto; filtradas por relevancia respecto al texto.
4. **Balance de fuentes** — si hay evidencia suficiente y coherente, sin depender solo del LLM.
5. **Gemini** — solo si hubo **respuesta de Fact Check** (`factCheckResult`); veredicto con caché en tabla `llm_cache`.
6. **Persistencia** — registro en `verifications_log` (Supabase, con RLS).

Diagramas Mermaid: [`docs/arquitectura/modelos/`](docs/arquitectura/modelos/).

---

## Stack tecnológico

| Capa | Tecnología | Rol |
|------|------------|-----|
| Interfaz | React 18, Vite 6, TypeScript, CSS propio | SPA responsive, modo claro/oscuro |
| API | Vercel Serverless (`api/*.ts`) | Endpoints HTTP, validación, orquestación |
| Dominio | `backend/services/`, `shared/` | Fact check, URL, YouTube, LLM, evaluación |
| Datos | Supabase (PostgreSQL) | Logs, feedback, caché LLM |
| Externos | Google Fact Check, Tavily, Gemini | Verificación y contexto |
| CI/CD | GitHub + Vercel | Push a `main` → despliegue automático |

Decisiones de arquitectura documentadas: [`docs/arquitectura/adr/`](docs/arquitectura/adr/).

---

## API (endpoints)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Estado del servicio |
| `POST` | `/api/verify` | Clasificar texto (`{ text, kind? }`) |
| `POST` | `/api/analyze-url` | Extraer texto desde URL o video |
| `POST` | `/api/feedback` | Retroalimentación (`verificationId`, `vote`) |
| `POST` | `/api/fact-check` | Consulta fact-check (uso interno / pruebas) |
| `GET` | `/api/evaluation` | Métricas por conjunto (requiere `FACTIFY_ADMIN_KEY` en producción) |

Contratos y códigos HTTP: [`docs/requerimientos.md`](docs/requerimientos.md).

---

## Estructura del repositorio

```text
Factifyyy/
├── frontend/              # Aplicación React (páginas, componentes, estilos)
├── api/                   # Funciones serverless Vercel
├── backend/services/      # Lógica de verificación y evaluación
├── shared/                # Analizador local y validación de entrada
├── data/                  # Datasets etiquetados (dev, test, holdout, final, real)
├── scripts/               # Evaluación y construcción de datasets
├── supabase/schema.sql    # PostgreSQL: verifications_log, user_feedback, llm_cache + RLS
├── docs/                  # Artefactos Hito 3 (objetivos, trazabilidad, pruebas, calidad…)
├── CHANGELOG.md           # Historial por versión e hito3
├── vercel.json
└── package.json
```

Trazabilidad **requerimiento → HU → PR**: [`docs/trazabilidad.md`](docs/trazabilidad.md). Backlog en Jira (proyecto **FTY**).

---

## Instalación y ejecución local

**Requisitos:** Node.js 18+, npm 9+, cuenta Vercel/Supabase y claves de APIs (para flujo completo).

```bash
git clone https://github.com/MrPipe7/Factifyyy.git
cd Factifyyy
npm install
npm run install:frontend

# Copiar plantilla y completar claves
cp .env.example .env.local
```

**Frontend + API en local** (recomendado):

```bash
npm run dev:vercel
```

Solo interfaz (Vite, sin serverless):

```bash
npm run dev
# http://localhost:5173 — verificación limitada si la API no está activa
```

### Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `SUPABASE_URL` | Sí (prod.) | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Sí (prod.) | Clave anon (API server-side; no exponer secretos al cliente) |
| `GOOGLE_FACT_CHECK_API_KEY` | Para fuentes FC | Google Fact Check Tools |
| `TAVILY_API_KEY` | Para búsqueda | Tavily Search |
| `GEMINI_API_KEY` | Para juez LLM | Google Gemini API |
| `GEMINI_MODELS` | No | Lista de modelos de respaldo (opcional) |
| `FACTIFY_ADMIN_KEY` | No | Protege `/api/evaluation` |

En **Vercel**: Project Settings → Environment Variables → redeploy. El archivo `.env.local` no se sube a git.

---

## Despliegue en producción

1. Ejecutar [`supabase/schema.sql`](supabase/schema.sql) en el SQL Editor de Supabase (tablas + políticas RLS).
2. Importar el repositorio en Vercel y configurar las variables.
3. Comprobar `GET https://<tu-dominio>/api/health` y una verificación de prueba en la UI.

Guía detallada de datos: `supabase/schema.sql` comentado al inicio.

---

## Calidad y métricas (referencia)

| Medición | Resultado documentado |
|----------|------------------------|
| Exactitud (*holdout*, modo LLM) | 90 % (36/40) — ver `docs/pruebas/evidencia/` |
| Exactitud (*final*, modo LLM) | 90 % (27/30) |
| Falsas clasificadas como confiables | 0 en reportes finales de evaluación |
| Prueba con usuarios (HU17) | Mejora de acierto 63,6 % → 90,9 % (n=11; ver `docs/objetivos.md`) |

Reproducir evaluación:

```bash
npm run test:evaluation -- --split holdout --mode llm
npm run test:evaluation -- --split final --mode llm
```

Modos `local` / `full`, splits `dev` | `test` | `real` | etc.: ver comentarios en `scripts/run-evaluation.mjs`. Caché en `.cache/evaluation/`.

---

## Privacidad y limitaciones

- **No se pide registro** de usuario; el historial es local en el navegador.
- El **texto verificado** se envía a proveedores externos (Google, Tavily, Gemini) según el flujo — documentado en requerimientos no funcionales: [`docs/requerimientos.md`](docs/requerimientos.md).
- **Video en producción:** extracción de subtítulos puede fallar por restricciones de YouTube (HU18 parcial).
- **No hay modelo ML propio** entrenado en el proyecto; HU19 queda como trabajo futuro.
- **Sin garantía** de verdad absoluta: priorizar **dudoso** cuando la evidencia es insuficiente.

Riesgos y deuda técnica: [`docs/riesgos.md`](docs/riesgos.md).

---

## Documentación del proyecto (Hito 3)

Índice de artefactos para revisión académica: **[`docs/README.md`](docs/README.md)**

Incluye objetivos medibles, requerimientos y alcance del MPV, matriz de trazabilidad, plan y resultados de pruebas, seguridad/eficiencia, ADR y modelos UML.

---

## Historial de cambios

Ver **[CHANGELOG.md](CHANGELOG.md)** (versiones 0.1.0 → 0.3.0, sección **hito3**).

---

## Licencia y uso

Código y documentación del **proyecto de título** de Felipe Figueroa. Uso de APIs de terceros sujeto a sus términos. Para referencia académica y reproducción del MPV según instrucciones de este README y `docs/`.

Si usas este repositorio en una evaluación, cita el **tag `hito3`** y los documentos en `docs/` como evidencia congelada del estado del MPV.