import json
from sqlalchemy.inspection import inspect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.agent.crud_tools import ALLOWED_TABLES, get_models_dict

# Models the AI should never inspect or operate on
_HIDDEN_MODELS = {"Company", "User", "CompanyInvitation"}
# Columns hidden from schema introspection (managed server-side)
_HIDDEN_COLUMNS = {"company_id", "created_by", "is_superadmin", "firebase_uid", "hashed_password"}



def describe_database_schema(tool_input: dict, db=None, user=None) -> str:
    """Returns the database schema for all models or a specific model."""
    model_name_filter = tool_input.get("model")
    models = get_models_dict()
    # Filter out hidden models
    models = {k: v for k, v in models.items() if k not in _HIDDEN_MODELS}
    
    if model_name_filter:
        if model_name_filter not in models:
            return json.dumps({"error": f"Model {model_name_filter} not found."})
        models = {model_name_filter: models[model_name_filter]}
    
    schema_info = {}
    for name, model_class in models.items():
        try:
            mapper = inspect(model_class)
            columns = []
            for col in mapper.columns:
                if col.name in _HIDDEN_COLUMNS:
                    continue
                col_info = {
                    "name": col.name,
                    "type": str(col.type),
                    "nullable": col.nullable,
                    "primary_key": col.primary_key
                }
                columns.append(col_info)
                
            relationships = []
            for rel in mapper.relationships:
                relationships.append({
                    "name": rel.key,
                    "target": rel.mapper.class_.__name__,
                    "direction": rel.direction.name
                })
                
            schema_info[name] = {
                "columns": columns,
                "relationships": relationships
            }
        except Exception:
            # Skip if it's not a properly mapped class
            pass

    return json.dumps({"schema": schema_info}, ensure_ascii=False)

async def preview_table_data(tool_input: dict, db: AsyncSession, user=None) -> str:
    """Returns a few sample rows from the specified table to understand data formats."""
    model_name = tool_input.get("model")
    limit = tool_input.get("limit", 3)
    
    models = get_models_dict()
    if model_name not in models:
        return json.dumps({"error": f"Model {model_name} not found."})
        
    if model_name not in ALLOWED_TABLES:
        return json.dumps({"error": f"No se permite previsualizar la tabla '{model_name}'."})
        
    model_class = models[model_name]
    
    try:
        query = select(model_class)
        # ── Tenant isolation ──
        if user and hasattr(model_class, "company_id"):
            query = query.where(model_class.company_id == user["company_id"])

        if hasattr(model_class, "id"):
            query = query.order_by(model_class.id.desc())
        query = query.limit(limit)
        
        result = await db.execute(query)
        records = result.scalars().all()
        
        data = []
        for rec in records:
            rec_dict = {}
            for col in inspect(model_class).columns:
                if col.name in _HIDDEN_COLUMNS:
                    continue
                val = getattr(rec, col.name)
                # handle non-serializable objects
                if val is not None:
                    if hasattr(val, "value"):
                        val = val.value
                    elif not isinstance(val, (str, int, float, bool, list, dict)):
                        val = str(val)
                rec_dict[col.name] = val
            data.append(rec_dict)
            
        return json.dumps({"preview": data}, ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": f"Error previewing table: {str(e)}"}, ensure_ascii=False)

SCHEMA_INSPECTOR_TOOL = {
    "name": "describe_database_schema",
    "description": "Obtener el esquema de la base de datos (modelos, campos, relaciones) para saber qué campos utilizar al crear o actualizar registros.",
    "input_schema": {
        "type": "object",
        "properties": {
            "model": {"type": "string", "description": "Opcional: Nombre del modelo específico para inspeccionar (ej. 'Client', 'Installation'). Si se omite, devuelve todos."},
        },
    },
}

PREVIEW_TABLE_DATA_TOOL = {
    "name": "preview_table_data",
    "description": "Obtener ejemplos reales de datos (últimas filas) de una tabla para entender los formatos (ej. cómo se guardan enumeradores o fechas) y evitar errores.",
    "input_schema": {
        "type": "object",
        "properties": {
            "model": {"type": "string", "description": "Nombre exacto del modelo (ej. 'Installation')."},
            "limit": {"type": "integer", "description": "Cantidad de filas a ver. Por defecto 3."}
        },
        "required": ["model"]
    }
}
