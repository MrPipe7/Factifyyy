# Dataset de evaluación (HU13)

Archivo: `evaluation_dataset.json` (100 casos). `evaluation_news.json` conserva los 30 casos originales.

## Estructura

Cada caso tiene: `id`, `title`, `text`, `expected_classification`, `validation_source`, `notes` y `split`.

## Conjuntos

| Conjunto | Casos | Confiable | Dudosa | Falsa | Uso |
|---|---|---|---|---|---|
| `dev` | 50 | 17 | 16 | 17 | Analizar errores y ajustar reglas (30 originales + 20 nuevos) |
| `test` | 50 | 17 | 16 | 17 | Medición final. **No se usa para ajustar reglas** |

## Criterios de etiquetado

- **Confiable:** el contenido identifica una fuente verificable (institución, documento, autor o dato comprobable), usa lenguaje neutral y no pide compartir con urgencia. Un tono alarmante no lo vuelve dudoso si hay fuente y datos.
- **Dudosa:** la afirmación es plausible pero no hay fuente identificable ni evidencia, o la causa o el hecho aún no está confirmado (rumores, testimonios únicos, promesas sin respaldo, atribuciones prematuras).
- **Falsa:** la afirmación contradice evidencia establecida o es una estafa, o combina teorías conspirativas, promesas imposibles, alarmismo extremo o presión para compartir.

## Línea base (analizador local, sin APIs externas)

Medida al crear el dataset, con `analyzeContent` de `shared/analyzer.ts`.

| Conjunto | Aciertos | Exactitud |
|---|---|---|
| `dev` | 38/50 | 76% |
| `test` | 23/50 | 46% |

Los 30 casos originales se clasifican correctamente. Los errores se concentran en los casos nuevos:
confiables oficiales clasificados como dudosos, y falsas (conspiración, estafa) clasificadas como dudosas.
Un caso falso se clasificó como confiable (id 95).

## Pendiente

- Revisión manual de las etiquetas de la clase Dudosa.
- Medir el modo completo (APIs externas + caída al análisis local) en la HU14.
