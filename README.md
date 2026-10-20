# 🛡️ Factify — Verificación de noticias con IA

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)

**Factify** es una plataforma web que analiza contenido noticioso y lo clasifica como **confiable**, **dudoso** o **falso**, utilizando un motor local basado en procesamiento de lenguaje natural (NLP) y reglas lingüísticas para emitir un veredicto.

🎓 Proyecto académico — Universidad Andrés Bello, Facultad de Ingeniería, Escuela de Ingeniería en Computación e Informática, Viña del Mar, 2026.

---

## 📑 Tabla de contenidos

- [Descripción general](#descripción-general)
- [Funcionalidades clave](#funcionalidades-clave)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Inicio rápido](#inicio-rápido)
- [Evaluación](#evaluación)
- [Infraestructura Serverless](#infraestructura-serverless)

---

## Descripción general

Factify permite al usuario pegar un texto noticioso y obtener en segundos una clasificación respaldada por:

- **Análisis heurístico local**: detección de señales de desinformación como mayúsculas excesivas, lenguaje alarmista, clickbait, falta de fuentes y estilo institucional.
- **Validación de entrada**: Se valida que el texto tenga al menos 20 caracteres y un máximo de 10.000 caracteres.
- **Alertas preventivas**: Muestra una advertencia visual antes de que el usuario comparta un contenido detectado como dudoso o falso.

Este repositorio corresponde a un **MVP** funcional, ejecutado de manera 100% local sin dependencias de bases de datos externas ni APIs de terceros.

---

## Funcionalidades clave

- Clasificación en tres niveles: **confiable**, **dudoso**, **falso**.
- Porcentaje de confianza basado en la solidez del análisis.
- Explicación comprensible y educativa del resultado.
- Interfaz moderna y minimalista con soporte para modo claro y oscuro.
- Advertencia preventiva (AlertModal) al intentar compartir desinformación.

---

## Stack tecnológico

| Área | Tecnología |
|------|-----------|
| **Frontend** | React 18, TypeScript, Vite 6 |
| **UI/UX** | CSS design system propio (`design.css` + `variables.css`) |
| **Motor NLP** | Algoritmo local en TypeScript (`shared/analyzer.ts`) |
| **Iconos** | Componentes SVG nativos |

---

## Arquitectura

```text
                    ┌──────────────────────────────────┐
                    │        Frontend (React)          │
                    │  HomePage → ResultPage → Alert   │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼───────────────────────┐
                    │       Motor NLP (Local)          │
                    │      (shared/analyzer.ts)        │
                    └──────────────────────────────────┘
```

El análisis se ejecuta íntegramente en el cliente mediante un motor de NLP basado en diccionarios y reglas sintácticas, garantizando privacidad, rapidez y autonomía.

---

## Estructura del repositorio

```text
Factifyy/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── components/         # Componentes React (HomePage, ResultPage, Navbar, AlertModal, etc)
│       │   ├── utils/              # Funciones de interconexión (verifyClient)
│       │   └── App.tsx             # Punto de entrada y gestión de estado
│       ├── components/
│       │   └── Icons.tsx           # Colección de iconos SVG
│       └── styles/
│           ├── design.css          # Sistema de diseño principal
│           ├── variables.css       # Variables de color y tipografía
│           └── app.css             # Tailwind generado
│
├── shared/                         # Lógica compartida
│   ├── analyzer.ts                 # Motor principal NLP heurístico
│   └── validateInput.ts            # Reglas de validación de texto
│
├── data/
│   ├── evaluation_news.json        # 30 casos de evaluación controlados
│   └── demo_examples.json          # Textos de prueba predefinidos
│
├── scripts/
│   └── run-evaluation.mjs          # Script evaluador de precisión
│
└── README.md                       # Documentación del proyecto
```

---

## Inicio rápido

### Requisitos
- Node.js 18+
- npm 9+

### Instalación y ejecución local

```bash
# Entrar a la carpeta del proyecto
cd Factifyy

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre **http://localhost:5173** en tu navegador para usar la plataforma.

---

## Evaluación

El proyecto incluye un script evaluador automatizado que somete el motor NLP local a **30 casos de prueba controlados** (noticias confiables, dudosas y falsas) para medir su precisión.

```bash
# Ejecutar desde la raíz del proyecto
npm run test:evaluation
```

Resultado esperado: **100%** de precisión en las 3 categorías (0% falsos positivos, 0% falsos negativos).

---

## Infraestructura Serverless

Implementación de HU06 (FTY-18) para despliegue en Vercel + Supabase:

- **FTY-18.1 CD Vercel:** el proyecto usa `vercel.json` y despliegue conectado al repositorio GitHub.
- **FTY-18.2 Supabase PostgreSQL:** el script DDL está en `supabase/schema.sql` (tablas `verifications_log` y `user_feedback`).
- **FTY-18.3 Variables seguras:** usar `.env.example` como plantilla y cargar variables en Vercel:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `GOOGLE_FACT_CHECK_API_KEY`
  - `TAVILY_API_KEY`
  - `FACTIFY_ADMIN_KEY`
- **FTY-18.4 Serverless Functions:** el directorio `/api` contiene funciones Node.js/TypeScript:
  - `api/verify.ts`
  - `api/feedback.ts`
  - `api/evaluation.ts`
  - `api/health.ts`
  - `api/fact-check.ts`

### Pasos de puesta en marcha

1. Crear proyecto Supabase y ejecutar `supabase/schema.sql` en SQL Editor.
2. Cargar variables en Vercel (Project Settings -> Environment Variables).
3. Verificar endpoints desplegados:
   - `GET /api/health`
   - `POST /api/verify`
   - `POST /api/feedback`
   - `GET /api/evaluation` (requiere header `x-factify-admin-key`)
4. Para desarrollo local integrado de frontend + serverless, usar:

```bash
npm run dev:vercel
```
