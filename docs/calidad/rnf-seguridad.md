# RNF · Seguridad (A2 + A6)

## Escenario RNF-04 — Secretos y configuración

| Campo | Valor |
|---|---|
| Fuente | Auditor (repositorio + Vercel) |
| Estímulo | Revisar `.gitignore`, historial, `.env.example` |
| Respuesta | Sin claves en git; despliegue usa variables de entorno |
| Medida | 0 secretos expuestos en repo público |

**Estado:** Cumple (revisión manual 2026-11-27).

## Escenario RNF-05 — Aislamiento datos Supabase

| Campo | Valor |
|---|---|
| Estímulo | Cliente anon inserta en `verifications_log`, `user_feedback`, `llm_cache` |
| Respuesta | Operaciones permitidas solo según RLS |
| Medida | Políticas definidas en `supabase/schema.sql`; sin SELECT masivo anónimo de datos ajenos |

**Estado:** Cumple por diseño; no hay autenticación de usuarios finales (datos no identificados).

## Escenario RNF-06 — Dependencias

| Campo | Valor |
|---|---|
| Estímulo | `npm audit` en raíz del monorepo API |
| Medida | 0 vulnerabilidades críticas/altas |
| Evidencia | `docs/calidad/reportes/npm-audit-2026-11-27.txt` |

**Estado:** Cumple (0 vulnerabilidades reportadas).

## Escenario RNF-05b — Validación de entrada (abuso)

| Campo | Valor |
|---|---|
| Estímulo | Payload malformado, texto vacío, longitud excesiva |
| Respuesta | 400/413 sin ejecutar lógica costosa |
| Medida | 100 % rechazos en casos CP-02-* (`docs/pruebas/casos.md`) |

**Estado:** Cumple (pruebas manuales).

## Hallazgos abiertos / limitaciones

| ID | Hallazgo | Severidad | Decisión |
|---|---|---|---|
| S-01 | Texto del usuario sale a Tavily, Google y Gemini | Informativo | Aceptado MVP; documentado en privacidad |
| S-02 | `SUPABASE_ANON_KEY` en backend serverless | Medio mitigado | RLS restrictivo; sin datos PII |
| S-03 | Endpoint `/api/evaluation` con clave admin opcional | Medio | Proteger con `FACTIFY_ADMIN_KEY` en prod. |

## Próximo paso A6

- Archivar salida de `npm audit` en cada release previa a `hito3`.
- Opcional: OWASP ZAP baseline contra frontend estático (sin auth).