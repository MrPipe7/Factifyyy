# ADR-02: PostgreSQL en Supabase

**Estado:** Aceptada  
**Fecha:** 2026-10 (HU06)

## Contexto

RF11 parcial, HU08 (feedback) y HU16 (`llm_cache`) requieren persistencia relacional, JSON para `result_json` y políticas RLS con cliente anon desde serverless.

## Alternativas

1. **Supabase** (PostgreSQL + PostgREST).
2. **Firebase Firestore** (documentos).
3. **SQLite en servidor** (no aplicable en serverless puro).

## Matriz (1–5)

| Criterio | Peso | Supabase | Firestore | SQLite server |
|---|---:|---:|---:|---:|
| SQL + FK feedback→verificación | 35 % | 5 | 3 | 5 |
| Tier gratuito | 25 % | 4 | 4 | N/A |
| Encaje serverless (HTTP) | 25 % | 5 | 5 | 1 |
| RLS / políticas finas | 15 % | 5 | 3 | 2 |
| **Ponderado** | 100 % | **4,70** | **3,45** | — |

## Decisión

**Supabase** con esquema en `supabase/schema.sql`.

## Consecuencias

- Migraciones vía SQL Editor o archivos versionados.
- RLS obligatorio para inserts anon.
- `SUPABASE_ANON_KEY` solo en backend.