# Solar ERP — Registro de Arquitectura y Cambios

> Documento vivo. Se actualiza cada vez que se archiva un cambio vía SDD.
> Última actualización: 2026-03-26

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
| 2026-03-26 | `anthropic==0.49.0` rompió `betas=["prompt-caching-2024-07-31"]` | El parámetro `betas` fue eliminado de `messages.create()` — prompt caching es GA | Removido de `chat_service.py` (2 lugares) y `planner.py` (1 lugar) |
| 2026-03-26 | `deploy.sh` borraba todas las env vars en Cloud Run (reintroducido) | `--set-env-vars` reemplaza TODO — vars críticas no pasadas se perdían | Cambiado a `--update-env-vars` + todas las vars críticas leídas del `.env` |

---

---

### [2026-03-26] dashboard-rework (Phases 0–7) — COMPLETO

**Objetivo**: Rediseño completo del dashboard con 4 pilares arquitectónicos.

**Pilares**:
1. **Bento Grid** — layout `grid-cols-4` consistente en todo el dashboard
2. **URL-Driven State** — `useURLState` hook: todo estado de UI (search, filtros, tabs, paginación) vive en la URL, no en `useState`
3. **Monochromismo Quirúrgico** — paleta `slate-950` + `sky-500` como único acento, sin colores de marca adicionales
4. **Zero Layout Shift** — `Suspense` + Skeletons en cada componente asíncrono

**Migración React Query v5**: 38 patrones `isFirstMount + useEffect` eliminados en 11 páginas. Todo data fetching vía `useQuery`/`useMutation`.

**Sub-rutas installations/[id]**: 4 tabs dedicadas con anti-waterfall por `queryKey` compartido:
- `/costs` — costos de la instalación
- `/activities` — actividades
- `/maintenance` — mantenimiento
- `/page` — vista principal (renombrada)

**BudgetBuilder**: extraído del monolito de presupuestos (951 → 364 líneas), exportación PDF preservada.

**Phase 7 hygiene**:
- `alert()` → toast (sonner)
- Silent catches → `handleApiError`
- `useEffect` data fetching → `useQuery`/`useMutation`

**Dead code eliminado**: `api.ts`, `types.ts`, `Card.tsx`

**Dark mode**: `globals.css`, `body`, `.gradient-mesh` reemplazada, 7 páginas migradas de `bg-white` a `slate-950`

**Archivos nuevos**:
- `frontend/src/hooks/use-url-state.ts` — URL-Driven State hook
- `frontend/src/lib/query-keys.ts` — typed factory 15 dominios
- `frontend/src/lib/handle-api-error.ts` — wrapper sonner toast
- `frontend/src/components/dashboard/metric-card/` — 5 variantes + skeleton
- `frontend/src/components/dashboard/data-table/` — DataTable genérico + skeleton
- `frontend/src/components/dashboard/breadcrumb.tsx`
- `frontend/src/components/dashboard/installation-tab-nav.tsx`
- `frontend/src/components/ui/modal.tsx`
- `frontend/src/app/dashboard/installations/[id]/costs/page.tsx`
- `frontend/src/app/dashboard/installations/[id]/activities/page.tsx`
- `frontend/src/app/dashboard/installations/[id]/maintenance/page.tsx`

---

## [2026-03-27] proactive-telegram-notifications — COMPLETO

### Qué hace
Sol manda mensajes proactivos a Telegram sin que el usuario inicie conversación. Cuatro tipos de notificaciones:
1. **Recordatorios de mantenimiento**: 7, 3, 1 día antes y el día mismo a las 8am Argentina
2. **Tareas con deadline**: mismo esquema de 4 pasos
3. **Tareas recurrentes**: recordatorio diario hasta que se marcan como listas
4. **Resumen semanal** (lunes 8am): instalaciones, actividades, presupuestos de la semana + eventos próximos

### Arquitectura
```
Cloud Scheduler (11:00 UTC diario / lunes)
  → POST /api/v1/internal/send-reminders
  → POST /api/v1/internal/send-weekly-summary
    → notifier.py → Supabase DB → tg.send_message() por cada usuario vinculado
```

### Nuevos archivos
- `backend/app/services/notifier.py` — lógica de todos los recordatorios
- `backend/app/routers/internal.py` — 2 endpoints protegidos con X-Internal-Secret
- `backend/app/services/agent/task_tools.py` — tools: create_task, complete_task, list_tasks
- `backend/alembic.ini` + `backend/alembic/env.py` + `backend/alembic/script.py.mako` — setup alembic (primera vez)
- `backend/alembic/versions/0001_proactive_notifications.py` — migración
- `docs/cloud-scheduler-setup.md` — comandos gcloud para configurar los jobs
- `backend/tests/test_notifier_threshold.py`, `test_internal_router_auth.py`, `test_task_tools.py`, `test_notifier_idempotency.py` — 28 tests

### Archivos modificados
- `backend/app/models/maintenance.py` — `notification_sent` (bool) → `last_notification_days_before` (int nullable)
- `backend/app/models/pending_task.py` — 3 columnas nuevas: `task_type`, `is_recurring`, `last_notification_days_before`
- `backend/app/services/agent/tool_registry.py` — 3 tools registradas
- `backend/app/services/agent/chat_service.py` — regla 20 en SYSTEM_PROMPT
- `deploy.sh` — fix CORS_ORIGINS: usa `--env-vars-file` con YAML temporal (brackets rompen `--update-env-vars`)

### Variables de entorno nuevas
- `INTERNAL_API_SECRET` — contraseña inventada por el usuario, protege los endpoints internos

### Cloud Scheduler jobs (GCP)
- `solar-erp-daily-reminders` — cron `0 11 * * *`, timezone `America/Argentina/Buenos_Aires`
- `solar-erp-weekly-summary` — cron `0 11 * * 1`, timezone `America/Argentina/Buenos_Aires`

### Gotchas importantes
- **Idempotencia**: si ya se mandó el mensaje hoy, no se manda de nuevo. Para resetear: `UPDATE pending_tasks SET last_notification_days_before = NULL WHERE is_recurring = true`
- **Migración**: correr cada `ALTER TABLE` por separado en el SQL editor de Supabase
- **CORS_ORIGINS en deploy.sh**: requiere comillas simples en el YAML: `CORS_ORIGINS: '$CORS_ORIGINS_VAL'`
- **Cloud Scheduler secret**: verificar que `.env` tenga `INTERNAL_API_SECRET` con valor ANTES de crear el job, sino queda vacío
- **branch mateo**: el fix de `betas=["prompt-caching-2024-07-31"]` no estaba — hubo que aplicarlo de nuevo en esta branch

### Cómo agregar una nueva tarea vía Sol (Telegram)
- Recurrente: *"Creá una tarea recurrente llamada 'Revisar stock'"*
- Con deadline: *"Creá una tarea para renovar el seguro el 15 de mayo"*
- Marcar lista: *"Marcá como lista la tarea [id]"*
- Listar: *"Mostrá las tareas pendientes"*

---

## Deuda técnica pendiente

- [ ] Tests del cambio `plan-and-execute` (Phase 5) — `deep_replace_vars`, `dotted_get`, `execute_plan`, `build_plan`
- [ ] Unificar tests en una carpeta centralizada (hoy están co-localizados con los módulos)

---

## Gotchas y trampas conocidas

| Fecha | Contexto | Gotcha |
|-------|---------|--------|
| 2026-03-26 | Next.js + Turbopack | `transpilePackages: ['three', '@react-three/fiber', '@react-three/drei']` en `next.config.ts` es necesario para que Turbopack procese esas libs |
| 2026-03-26 | Docker | Anonymous volumes requieren `--no-cache` en el build al agregar paquetes nuevos |
| 2026-03-26 | CSS | `background-image` tiene mayor especificidad que `background-color` — si hay un `.gradient-mesh` en el className hay que removerlo, no solo sobreescribir el color |
| 2026-03-26 | `useURLState` | Siempre anotar el tipo explícito: `useURLState<string>('search', '')` para evitar inferencia incorrecta |

---

## Procedimiento de deploy

```bash
./deploy.sh   # desde la raíz del proyecto
```

El script lee `ANTHROPIC_API_KEY` del `.env` raíz y hace build → push → gcloud update.

**⚠️ Nunca usar `--set-env-vars` directamente en gcloud** — reemplaza TODAS las env vars del servicio.
