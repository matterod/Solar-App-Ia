# Solar ERP — Registro de Arquitectura y Cambios

> Documento vivo. Se actualiza cada vez que se archiva un cambio vía SDD.
> Última actualización: 2026-03-23

---

## Stack actual

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5, TailwindCSS 4, Framer Motion, Firebase Auth |
| Backend | FastAPI (Python), SQLAlchemy async, Pydantic v2, Alembic, Uvicorn |
| Base de datos | PostgreSQL 16 — Supabase (PgBouncer transaction mode) |
| IA | Anthropic Claude — Sol ☀️ |
| Deploy | Frontend → Vercel · Backend → Google Cloud Run · DB → Supabase |
| Storage | AWS S3 |
| Mensajería | Telegram Bot + WhatsApp (httpx) |

---

## Arquitectura del Agente Sol

### Pipeline actual (2026-03-23)

```
user message
    │
    ▼
┌─────────────────────────────────────────────┐
│  build_plan()  —  claude-sonnet-4-5         │
│  Prompt corto (3 líneas) + catálogo de      │
│  tools (solo nombre+descripción, sin schema)│
│  → devuelve JSON plan o {"mode":"reactive"} │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   mode=plan        mode=reactive
       │                │
       ▼                ▼
┌──────────────┐  ┌─────────────────────────┐
│ execute_plan │  │  _reactive_loop()        │
│ Python puro  │  │  claude-haiku-4-5        │
│ 0 tokens     │  │  Loop hasta 10 iters     │
│ ${var} refs  │  │  Con prompt caching      │
│ on_found /   │  │  + compresión de results │
│ on_empty     │  └─────────────────────────┘
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  _synthesize()  —  claude-haiku-4-5         │
│  Prompt mínimo + lista de resultados        │
│  → respuesta en español rioplatense         │
└─────────────────────────────────────────────┘
```

### Eficiencia de tokens estimada
- **Path determinístico** (80% de requests): ~85% ahorro vs loop reactivo original
- **Path reactivo** (20% de requests): ~55% ahorro (prompt caching + compresión)
- **Promedio ponderado**: ~75% reducción de tokens

---

## Cambios implementados

### [2026-03-23] prompt-caching-compression

**Problema**: El loop reactivo enviaba ~11KB de datos estáticos (system prompt + 13 tool schemas) en cada iteración, y los tool results crudos se acumulaban en el historial de mensajes.

**Solución**:
1. **Prompt Caching** — `system` convertido a lista de bloques con `cache_control: ephemeral`. Último tool schema marcado al call site. `betas=["prompt-caching-2024-07-31"]`. Ahorra ~70% de tokens en la parte estática a partir de la 2da iteración.
2. **Compresión de tool results** — nuevo módulo `compression.py` con `compress_tool_result()`. `search_records` → count + ids. `describe_database_schema` sin filtro → solo nombres de tablas. Resultados ≥ 2KB → truncados a 1500 chars.

**Archivos**:
- `backend/app/services/agent/compression.py` — nuevo
- `backend/app/services/agent/chat_service.py` — modificado
- `backend/conftest.py` — nuevo

---

### [2026-03-23] plan-and-execute

**Problema**: Cada request disparaba un loop reactivo de hasta 10 iteraciones, cada una enviando el sistema completo + contexto acumulado. El 80% de los casos son CRUD determinístico que no necesita razonamiento iterativo.

**Solución**: Pipeline de 3 fases reemplaza el loop reactivo para requests determinísticos:
1. **Planner** (`planner.py`) — `claude-sonnet-4-5`, recibe solo catálogo de tools (nombre+descripción), devuelve plan JSON con steps, variable captures y condicionales.
2. **Executor** (`executor.py`) — Python puro, cero modelo. Resuelve referencias `${var}`, ejecuta tools via `execute_tool()`, maneja `on_found`/`on_empty`.
3. **Synthesizer** — `claude-haiku-4-5`, prompt de 1 línea, formatea resultados en español rioplatense.
4. **Fallback reactivo** — loop original preservado intacto para requests complejos/ambiguos.

**Archivos**:
- `backend/app/services/agent/plan_types.py` — nuevo
- `backend/app/services/agent/planner.py` — nuevo
- `backend/app/services/agent/executor.py` — nuevo
- `backend/app/services/agent/tool_registry.py` — agregado `get_tool_catalog()`
- `backend/app/services/agent/chat_service.py` — routing branch, `_reactive_loop()`, `_synthesize()`

---

## Problemas resueltos

| Fecha | Problema | Causa raíz | Solución |
|-------|----------|-----------|---------|
| 2026-03-19 | Sol no registraba Problemas desde Telegram | `company_id` llegaba como tipo incorrecto desde Telegram vs web | Guard explícito de UUID + logging diagnóstico en `add_problem()` |
| 2026-03-23 | Deploy rompió todas las env vars de Cloud Run | `--set-env-vars` reemplaza TODO, no hace update | Usar `--update-env-vars` o el `deploy.sh` que lee del `.env` |

---

## Deuda técnica pendiente

- [ ] Tests del cambio `plan-and-execute` (Phase 5) — `deep_replace_vars`, `dotted_get`, `execute_plan`, `build_plan`
- [ ] Unificar tests en una carpeta centralizada (hoy están co-localizados con los módulos)

---

## Procedimiento de deploy

```bash
./deploy.sh   # desde la raíz del proyecto
```

El script lee `ANTHROPIC_API_KEY` del `.env` raíz y hace build → push → gcloud update.

**⚠️ Nunca usar `--set-env-vars` directamente en gcloud** — reemplaza TODAS las env vars del servicio.
