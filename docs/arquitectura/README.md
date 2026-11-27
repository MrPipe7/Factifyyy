# A7 · Modelamiento y decisiones arquitectónicas

Camino: **UML**

Factify usa el camino **UML** (no C4+BPMN): contexto, componentes/capas, despliegue, secuencia y flujo de decisión alineados con lo desplegado en Vercel + Supabase.

## Stack (resumen)

| Capa | Tecnología | ADR |
|---|---|---|
| Frontend | React 18, Vite, TypeScript | — |
| API | Vercel Serverless Functions (`api/`) | ADR-01 |
| Lógica | `backend/services/`, `shared/` | ADR-03 |
| Datos | Supabase PostgreSQL | ADR-02 |
| Externos | Google Fact Check, Tavily, Gemini | ADR-03 |

## Diagramas (`modelos/`)

| Archivo | Tipo | Uso |
|---|---|---|
| `secuencia-verify.mmd` | Secuencia UML | `POST /api/verify` |
| `flujo-decision.mmd` | Actividad / flujo | Motor de clasificación |
| `contexto.mmd` | Contexto | Actor y APIs externas |

Exportar PNG desde [mermaid.live](https://mermaid.live) para el informe; los `.mmd` en repo son fuente de verdad.

## Coherencia con código

- **Gemini:** se invoca solo si `factCheckResult` existe (`backend/services/verificationService.ts`).
- **Persistencia:** DDL en `supabase/schema.sql` (3 tablas + RLS).
- **Despliegue:** `vercel.json`, URL prod. documentada en README raíz.

## ADRs

| ID | Título |
|---|---|
| [ADR-01](adr/ADR-01-vercel-serverless.md) | Despliegue serverless en Vercel |
| [ADR-02](adr/ADR-02-supabase-postgresql.md) | PostgreSQL gestionado (Supabase) |
| [ADR-03](adr/ADR-03-gemini-juez-externo.md) | Gemini API como juez (vs ML propio) |