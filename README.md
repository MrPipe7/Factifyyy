# Factify — Verificación de noticias con IA y fuentes

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)

**Factify** es un MVP web que clasifica afirmaciones noticiosas como **confiable**, **dudoso** o **falso**, con explicación, fuentes consultadas y alerta preventiva antes de compartir.

- **Producción:** https://factifyyy.vercel.app  
- **Proyecto de título** — Universidad Andrés Bello, Escuela de Ingeniería en Computación e Informática, 2026.

---

## Tabla de contenidos

- [Qué hace el MPV](#qué-hace-el-mvp)
- [Stack](#stack)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Inicio rápido (local)](#inicio-rápido-local)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue (Vercel + Supabase)](#despliegue-vercel--supabase)
- [Evaluación técnica](#evaluación-técnica)
- [Documentación Hito 3](#documentación-hito-3)

---

## Qué hace el MPV

1. **Texto** (20–10.000 caracteres), **URL de artículo** o **enlace YouTube/Shorts** (subtítulos cuando están disponibles).
2. Consulta **Google Fact Check** y **Tavily**, aplica **reglas locales** y, si hubo respuesta de Fact Check, un **juez Gemini (API)** con caché en Supabase.
3. Muestra clasificación, explicación, señales, fuentes y **alerta** si el resultado es dudoso o falso.
4. Opcional: feedback útil / poco útil, historial local, consejos de alfabetización mediática.

No se muestra porcentaje de confianza numérico (el veredicto se basa en evidencia y reglas documentadas).

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, TypeScript, Vite 6 |
| API | Vercel Serverless Functions (`api/`) |
| Lógica | `backend/services/`, `shared/` |
| Datos | Supabase (PostgreSQL), tablas en `supabase/schema.sql` |
| Externos | Google Fact Check, Tavily, Gemini |

---

## Arquitectura

```text
Usuario → Frontend (React) → /api/* (Vercel)
                              → verificationService
                                   → Fact Check + Tavily
                                   → Gemini (si hay factCheckResult)
                                   → Supabase (log, feedback, llm_cache)
```

Diagramas UML (Mermaid): `docs/arquitectura/modelos/`.

---

## Estructura del repositorio

```text
Factifyyy/
├── api/                 # Endpoints serverless
├── backend/services/    # Lógica de negocio
├── frontend/            # SPA React
├── shared/              # Reglas y validación
├── data/                # Conjuntos de evaluación
├── scripts/             # run-evaluation.mjs
├── supabase/schema.sql  # DDL + RLS
├── docs/                # Artefactos Hito 3 (objetivos, trazabilidad, pruebas…)
├── CHANGELOG.md
└── vercel.json
```

---

## Inicio rápido (local)

**Requisitos:** Node.js 18+, npm 9+

```bash
cd Factifyyy
npm install
npm run install:frontend
cp .env.example .env.local   # completar claves (ver abajo)
npm run dev:vercel           # frontend + API local (puerto 3000 típico)
```

Solo interfaz sin API serverless:

```bash
npm run dev   # http://localhost:5173 (verify puede usar fallback limitado)
```

---

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | Persistencia |
| `SUPABASE_ANON_KEY` | Cliente Supabase en API |
| `GOOGLE_FACT_CHECK_API_KEY` | Verificadores |
| `TAVILY_API_KEY` | Búsqueda web |
| `GEMINI_API_KEY` | Juez LLM |
| `GEMINI_MODELS` | Opcional, cadena de modelos |
| `FACTIFY_ADMIN_KEY` | Opcional, `/api/evaluation` |

Plantilla: `.env.example`. En producción: **Vercel → Environment Variables** (redeploy tras cambios).

---

## Despliegue (Vercel + Supabase)

1. Crear proyecto en [Supabase](https://supabase.com) y ejecutar `supabase/schema.sql` en el SQL Editor (incluye RLS).
2. Conectar el repo en [Vercel](https://vercel.com) y cargar las variables anteriores.
3. Verificar:
   - `GET /api/health` → `{ "ok": true }`
   - `POST /api/verify` con JSON `{ "text": "…" }` (≥ 20 caracteres)

---

## Evaluación técnica

```bash
npm run test:evaluation -- --split holdout --mode llm
npm run test:evaluation -- --split final --mode llm
```

Requiere claves en `.env.local`. Respuestas de APIs en caché bajo `.cache/evaluation`. Evidencia archivada en `docs/pruebas/evidencia/`.

---

## Documentación Hito 3

Índice completo: **[docs/README.md](docs/README.md)**

Incluye objetivos medibles, requerimientos, trazabilidad, plan de pruebas, calidad (seguridad/eficiencia), ADR y riesgos (artefactos A1–A9 INSW422).

---

## Licencia y autoría

Proyecto académico — Felipe Figueroa. Código y documentación en este repositorio salvo APIs de terceros sujetas a sus términos.