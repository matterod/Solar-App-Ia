---
description: Solar ERP AI agent tool development — how to create and maintain Sol's tools
---

# Solar ERP — Agent Tools Skill

## Agent Name: Sol ☀️

## Architecture Overview

El agente Sol ahora está **integrado directamente en el backend de FastAPI** (en `backend/app/routers/agent.py`).
En lugar de depender de múltiples herramientas estrictas que hacían llamadas HTTP ("agent/sol/tools.py" y "agent/sol/client.py" ahora se consideran obsoletas), el sistema utiliza un enfoque más genérico y dinámico gestionado por un **Registry** (`backend/app/services/agent/tool_registry.py`).

Sol ahora cuenta con herramientas genéricas de CRUD que le permiten interactuar directamente con cualquier modelo de SQLAlchemy, y herramientas de dominio específico para lógica de negocio más compleja (estadísticas, inventario, mantenimiento).

## Existing Tools

Las herramientas actuales están registradas de forma centralizada en `backend/app/services/agent/tool_registry.py`:

| Tool                       | Description                                                             | Ubicación                             |
| -------------------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| `describe_database_schema` | Lee la estructura de la base de datos para saber qué campos utilizar.   | `app.services.agent.schema_inspector` |
| `preview_table_data`       | Previsualiza datos de una tabla (primeras filas).                       | `app.services.agent.schema_inspector` |
| `create_record`            | Crea cualquier registro genérico (Cliente, Instalación, etc.) dinámico. | `app.services.agent.crud_tools`       |
| `update_record`            | Actualiza cualquier registro genérico.                                  | `app.services.agent.crud_tools`       |
| `delete_record`            | Borra cualquier registro genérico.                                      | `app.services.agent.crud_tools`       |
| `search_records`           | Busca registros en cualquier tabla basado en propiedades y filtros.     | `app.services.agent.crud_tools`       |
| `get_dashboard_stats`      | Obtiene estadísticas generales del dashboard.                           | `app.services.dashboard_service`      |
| `update_stock`             | Actualiza el inventario.                                                | `app.services.inventory_service`      |
| `schedule_maintenance`     | Programa un mantenimiento.                                              | `app.services.maintenance_service`    |
| `get_upcoming_maintenance` | Obtiene los próximos mantenimientos.                                    | `app.services.maintenance_service`    |

## Tool Definition Pattern

Las herramientas se definen usando el formato de Anthropic (muy similar al de OpenAI). 
El schema y la función que lo ejecuta se centralizan en el Tool Registry (`backend/app/services/agent/tool_registry.py`).

Ejemplo de esquema (generalmente se define junto a su función en el servicio correspondiente o en los tools del agente):
```python
TOOL_SCHEMA = {
    "name": "mi_nueva_tool",
    "description": "Qué hace la tool.",
    "input_schema": {
        "type": "object",
        "properties": {
            "parametro": {"type": "string", "description": "Descripción"},
        },
        "required": ["parametro"]
    }
}
```

## Adding a New Tool

Para agregar una nueva herramienta:

1. **Crear la función ejecutora**: Lo ideal es crearla en `backend/app/services/` (ej. si es de inventario, en `inventory_service.py`).
2. **Definir el schema de la tool**: En el mismo archivo o en uno de esquemas de API de Claude.
3. **Registrarla en `tool_registry.py`**:
   - Importar la función y el schema.
   - Registrar con `registry.register(AgentTool(name=..., description=..., category=..., input_schema=..., handler=...))`.

## System Prompt Language

Sol responde siempre en **Español (Argentino)**. El system prompt está definido directamente en la ruta del chat en `backend/app/routers/agent.py`.

## Agent Loop

1. El frontend/cliente envía un mensaje mediante el endpoint de FastAPI `POST /agent/chat`.
2. El router de FastAPI invoca a la API de Claude inyectándole el System Prompt y las tools desde el `tool_registry.py`.
3. Si Claude devuelve `tool_use`, el backend de FastAPI ejecuta internamente la función asociada en Python, con acceso directo a la DB a través de SQLAlchemy.
4. FastAPI le envía de vuelta los resultados de la función a Claude.
5. Se repite hasta que Claude da su respuesta final en texto o se alcanzan las iteraciones máximas.
