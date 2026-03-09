"""
Sol Agent — Tool Definitions (Anthropic/Claude format)

These tools map directly to FastAPI backend endpoints.
The agent NEVER accesses the database — only the API.
"""

TOOLS = [
    {
        "name": "search_installations",
        "description": "Buscar instalaciones por nombre de ubicación, nombre de cliente, estado o ciudad. Útil para encontrar información sobre proyectos solares.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Término de búsqueda (nombre de ubicación, cliente, etc.)"
                },
                "status": {
                    "type": "string",
                    "description": "Filtrar por estado",
                    "enum": ["pending", "in_progress", "completed", "maintenance", "inactive"]
                }
            }
        }
    },
    {
        "name": "get_installation_detail",
        "description": "Obtener detalles completos de una instalación específica por su ID, incluyendo paneles, inversores, potencia, actividades y mantenimientos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "installation_id": {
                    "type": "string",
                    "description": "UUID de la instalación"
                }
            },
            "required": ["installation_id"]
        }
    },
    {
        "name": "create_activity",
        "description": "Registrar una nueva actividad o trabajo realizado en una instalación.",
        "input_schema": {
            "type": "object",
            "properties": {
                "installation_id": {
                    "type": "string",
                    "description": "UUID de la instalación"
                },
                "title": {
                    "type": "string",
                    "description": "Título breve de la actividad"
                },
                "description": {
                    "type": "string",
                    "description": "Descripción detallada del trabajo realizado"
                },
                "duration_minutes": {
                    "type": "integer",
                    "description": "Duración en minutos"
                }
            },
            "required": ["installation_id", "title"]
        }
    },
    {
        "name": "schedule_maintenance",
        "description": "Programar un nuevo mantenimiento para una instalación.",
        "input_schema": {
            "type": "object",
            "properties": {
                "installation_id": {
                    "type": "string",
                    "description": "UUID de la instalación"
                },
                "scheduled_date": {
                    "type": "string",
                    "description": "Fecha programada en formato YYYY-MM-DD"
                },
                "maintenance_type": {
                    "type": "string",
                    "description": "Tipo de mantenimiento (preventivo, correctivo, rutina)"
                },
                "description": {
                    "type": "string",
                    "description": "Descripción del mantenimiento"
                }
            },
            "required": ["installation_id", "scheduled_date", "maintenance_type"]
        }
    },
    {
        "name": "get_upcoming_maintenance",
        "description": "Obtener la lista de mantenimientos programados próximos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "days": {
                    "type": "integer",
                    "description": "Días hacia adelante a consultar (por defecto 30)"
                }
            }
        }
    },
    {
        "name": "create_task",
        "description": "Crear una nueva tarea pendiente.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Título de la tarea"
                },
                "description": {
                    "type": "string",
                    "description": "Descripción de la tarea"
                },
                "priority": {
                    "type": "string",
                    "description": "Prioridad de la tarea",
                    "enum": ["low", "medium", "high", "urgent"]
                },
                "due_date": {
                    "type": "string",
                    "description": "Fecha límite en formato YYYY-MM-DD"
                },
                "installation_id": {
                    "type": "string",
                    "description": "UUID de la instalación relacionada (opcional)"
                }
            },
            "required": ["title", "priority"]
        }
    },
    {
        "name": "search_products",
        "description": "Buscar productos en el inventario. Puede filtrar por stock bajo.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Término de búsqueda (nombre, SKU, categoría)"
                },
                "low_stock_only": {
                    "type": "boolean",
                    "description": "Si es true, solo muestra productos con stock bajo"
                }
            }
        }
    },
    {
        "name": "get_dashboard_stats",
        "description": "Obtener estadísticas generales del negocio: total de clientes, instalaciones, potencia instalada, mantenimientos próximos, tareas pendientes y productos con stock bajo.",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "search_clients",
        "description": "Buscar clientes por nombre, empresa, email o ciudad.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Término de búsqueda"
                }
            }
        }
    },
]
