# Factify — Plataforma de verificación de noticias mediante inteligencia artificial y contraste de fuentes

---

## Identificación del proyecto

| Campo | Detalle |
|-------|---------|
| **Nombre** | Factify |
| **Tipo** | Producto mínimo viable (MPV), desplegado en entorno de producción |
| **Institución** | Universidad Andrés Bello — Facultad de Ingeniería — Escuela de Ingeniería en Computación e Informática |
| **Instancia académica** | Proyecto de título (asignatura INSW422) |
| **Autor** | Felipe Figueroa |
| **Año** | 2026 |
| **Demostración en línea** | [https://factifyyy.vercel.app](https://factifyyy.vercel.app) |
| **Repositorio** | [github.com/MrPipe7/Factifyyy](https://github.com/MrPipe7/Factifyyy) |
| **Evidencia de cierre (Hito 3)** | Documentación en [`docs/`](docs/README.md) · etiqueta Git [`hito3`](https://github.com/MrPipe7/Factifyyy/releases/tag/hito3) · [`CHANGELOG.md`](CHANGELOG.md) |

---

## Resumen

**Factify** es una aplicación web que apoya la verificación de afirmaciones de carácter noticioso antes de su difusión. El usuario puede ingresar **texto**, la **URL** de un artículo o un **enlace a video** (YouTube o Shorts, cuando existen subtítulos). El sistema entrega una **clasificación discretizada** en tres categorías — *confiable*, *dudoso* y *falso* —, junto con una **explicación**, las **fuentes consultadas** y una **advertencia preventiva** cuando el resultado no es confiable.

La solución combina **heurísticas lingüísticas locales**, consulta a **Google Fact Check Tools** y **Tavily Search**, reglas de balance de evidencia y, condicionado a que exista respuesta de verificación externa, un **modelo de lenguaje de terceros (Google Gemini)** utilizado como juez sobre la afirmación y extractos de fuentes. No se emplea un modelo de aprendizaje automático entrenado por el proyecto; el motor evolucionó desde un prototipo local (Iteración 1) hasta un **MPV distribuido** en Vercel y Supabase (Iteraciones 2 y 3).

Este documento constituye la **carta de presentación del repositorio**: orienta a revisores, docentes y evaluadores sobre el propósito del sistema, su alcance, arquitectura, forma de despliegue y ubicación de la evidencia académica.

---

## Problemática abordada y alcance

El incremento de la desinformación y la velocidad de circulación de contenidos en redes dificultan el contraste previo a la difusión. El alcance de Factify **no** comprende la erradicación del fenómeno social de la desinformación, sino la **verificación asistida de una afirmación concreta**, con transparencia respecto del origen del veredicto.

**Incluido en el MPV:** verificación por texto y URL; análisis por subtítulos de video (con limitaciones documentadas en producción); registro de verificaciones y retroalimentación; historial local; material de alfabetización mediática; evaluación técnica con conjuntos etiquetados.

**Excluido o parcial:** transcripción automática de audio; modelo de clasificación propio (HU19); métrica de “porcentaje de confianza” (retirada por baja interpretabilidad); cobertura completa de video en el entorno serverless de producción.

Detalle de requerimientos y exclusiones: [`docs/requerimientos.md`](docs/requerimientos.md).

---

## Descripción funcional

| Módulo | Descripción |
|--------|-------------|
| Verificación de texto | Entrada validada entre 20 y 10.000 caracteres; respuestas HTTP 400/413 ante entradas inválidas. |
| Ingreso por URL | Extracción de contenido editorial; alternativa de pegado manual ante bloqueos del sitio origen. |
| Ingreso por video | Obtención de subtítulos o metadatos de título; mensajes explícitos ante ausencia de texto analizable. |
| Presentación de resultados | Clasificación, explicación, señales detectadas, estadísticas de fuentes y procedencia del análisis. |
| Alerta preventiva | Intervención en interfaz ante clasificación *dudosa* o *falsa*. |
| Retroalimentación | Registro opcional de utilidad de la explicación asociado al identificador de verificación. |
| Historial | Persistencia local de consultas recientes sin cuenta de usuario. |
| Consejos educativos | Contenidos curados sobre sesgos cognitivos, clickbait y verificación de fuentes. |
| Evaluación técnica | Ejecución reproducible sobre conjuntos en `data/` con reporte de exactitud y matriz de confusión. |

Historias de usuario, sprints y trazabilidad: [`docs/trazabilidad.md`](docs/trazabilidad.md).

---

## Motor de decisión (síntesis)

La lógica central reside en `backend/services/verificationService.ts`. El orden de precedencia, documentado en [`docs/arquitectura/`](docs/arquitectura/README.md) y en los diagramas de [`docs/arquitectura/modelos/`](docs/arquitectura/modelos/), es el siguiente:

1. Análisis de señales lingüísticas (`shared/analyzer.ts`).
2. Consulta paralela a Google Fact Check y Tavily; filtrado de fuentes por relevancia lexical.
3. Aplicación del veredicto de un verificador cuando la similitud con la afirmación analizada alcanza el umbral definido (0,75).
4. Balance de fuentes a favor, en contra o neutrales cuando no existe coincidencia cercana con ClaimReview.
5. Consulta a Gemini **únicamente** si la etapa de Fact Check devolvió resultado (`factCheckResult`); respuestas almacenadas en `llm_cache` (Supabase).
6. Registro de la verificación en `verifications_log` con políticas RLS.

---

## Arquitectura de software

| Capa | Implementación | Responsabilidad |
|------|----------------|-----------------|
| Presentación | React 18, Vite 6, TypeScript | Interfaz de usuario y consumo de la API |
| Servicio HTTP | Funciones serverless Node.js (`api/`) | Validación de entrada, orquestación, códigos de estado |
| Dominio | `backend/services/`, `shared/` | Integración con APIs externas, reglas, evaluación |
| Persistencia | Supabase (PostgreSQL) | Logs, feedback, caché de veredictos LLM |
| Integración | Google Fact Check, Tavily, Gemini | Evidencia externa y juicio asistido |
| Despliegue | Vercel, GitHub | Entrega continua desde rama `main` |

Registro de decisiones arquitectónicas (ADR): [`docs/arquitectura/adr/`](docs/arquitectura/adr/). Esquema de base de datos: [`supabase/schema.sql`](supabase/schema.sql).

---

## Contratos de servicio (API)

| Método | Ruta | Función |
|--------|------|---------|
| `GET` | `/api/health` | Comprobación de disponibilidad |
| `POST` | `/api/verify` | Clasificación de texto |
| `POST` | `/api/analyze-url` | Extracción y clasificación desde URL o video |
| `POST` | `/api/feedback` | Registro de retroalimentación del usuario |
| `POST` | `/api/fact-check` | Consulta de verificación (uso técnico) |
| `GET` | `/api/evaluation` | Métricas de evaluación (protegido en producción) |

Especificación ampliada: [`docs/requerimientos.md`](docs/requerimientos.md).

---

## Organización del repositorio

```text
Factifyyy/
├── frontend/                 # Capa de presentación
├── api/                      # Endpoints serverless
├── backend/services/         # Servicios de dominio
├── shared/                   # Reglas y validación compartida
├── data/                     # Conjuntos de evaluación etiquetados
├── scripts/                    # Automatización de evaluación
├── supabase/schema.sql       # Definición DDL y RLS
├── docs/                     # Artefactos de objetivos, trazabilidad y calidad
├── CHANGELOG.md              # Registro de versiones
└── vercel.json               # Configuración de despliegue
```

---

## Instalación, configuración y despliegue

### Requisitos

Node.js 18 o superior, npm 9 o superior, cuentas en Vercel y Supabase, y claves de las APIs indicadas para operación integral.

### Ejecución en entorno de desarrollo

```bash
git clone https://github.com/MrPipe7/Factifyyy.git
cd Factifyyy
npm install
npm run install:frontend
cp .env.example .env.local   # completar variables (ver tabla inferior)
npm run dev:vercel           # interfaz y funciones serverless locales
```

La ejecución `npm run dev` levanta únicamente el frontend (Vite); la verificación completa requiere el entorno con API.

### Variables de entorno

| Variable | Relevancia |
|----------|------------|
| `SUPABASE_URL` | Conexión al proyecto Supabase |
| `SUPABASE_ANON_KEY` | Cliente desde funciones serverless (no publicar secretos en el cliente web) |
| `GOOGLE_FACT_CHECK_API_KEY` | Google Fact Check Tools |
| `TAVILY_API_KEY` | Tavily Search |
| `GEMINI_API_KEY` | API de Gemini |
| `GEMINI_MODELS` | Opcional; cadena de modelos de respaldo |
| `FACTIFY_ADMIN_KEY` | Opcional; protege el endpoint de evaluación |

En producción, las variables se configuran en Vercel; cualquier modificación exige un nuevo despliegue. El archivo `.env.local` permanece fuera del control de versiones.

### Puesta en marcha en producción

1. Ejecutar el script [`supabase/schema.sql`](supabase/schema.sql) en el editor SQL de Supabase.
2. Vincular el repositorio en Vercel y cargar las variables de entorno.
3. Validar `GET /api/health` y un caso representativo de `POST /api/verify`.

---

## Verificación de calidad (referencia)

| Indicador | Resultado documentado |
|-----------|------------------------|
| Exactitud en conjunto *holdout* (modo con LLM) | 90 % (36/40) |
| Exactitud en conjunto *final* (modo con LLM) | 90 % (27/30) |
| Falsos positivos graves (falsa → confiable) | 0 en reportes finales de evaluación |
| Prueba con usuarios (HU17) | Mejora de exactitud del participante: 63,6 % a 90,9 % (n = 11) |

Reproducción:

```bash
npm run test:evaluation -- --split holdout --mode llm
npm run test:evaluation -- --split final --mode llm
```

Evidencia archivada: [`docs/pruebas/evidencia/`](docs/pruebas/evidencia/). Objetivos medibles: [`docs/objetivos.md`](docs/objetivos.md).

---

## Privacidad, riesgos y limitaciones

- No se exige registro de identidad; el historial de consultas permanece en el navegador del usuario.
- El contenido sometido a verificación se transmite a proveedores externos (Google, Tavily, Gemini) conforme al diseño del MPV.
- La extracción de subtítulos de YouTube presenta **restricciones en producción** (riesgo materializado; ver [`docs/riesgos.md`](docs/riesgos.md)).
- Los veredictos constituyen **apoyo a la decisión**, no certificación absoluta de veracidad.

---

## Documentación académica y control de cambios

El conjunto de artefactos requeridos para el Hito 3 se indexa en **[`docs/README.md`](docs/README.md)** (objetivos, requerimientos, trazabilidad, plan y resultados de pruebas, atributos de calidad, arquitectura y riesgos).

El historial de incrementos por versión e hito académico se registra en **[`CHANGELOG.md`](CHANGELOG.md)**.

La gestión de trabajo se realiza en Jira (proyecto **FTY**), con integración a ramas y pull requests de GitHub.

---

## Autoría y uso

Obra de titulación de **Felipe Figueroa**. El código y la documentación se publican con fines de revisión académica y reproducción del MPV según las instrucciones de este archivo y de la carpeta `docs/`. El uso de servicios de terceros queda sujeto a los términos de cada proveedor.

Para citar el estado congelado del MPV en evaluaciones, utilícese la etiqueta **`hito3`** y la documentación asociada en `docs/`.