import json
import logging
import datetime
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.inspection import inspect

import app.models

def get_models_dict():
    """Returns a dictionary of model name -> SQLAlchemy model class"""
    models = {}
    if hasattr(app.models, '__all__'):
        for model_name in app.models.__all__:
            model_class = getattr(app.models, model_name)
            models[model_name] = model_class
    return models

logger = logging.getLogger(__name__)

ALLOWED_TABLES = {
    "Client", "Installation", "Activity", "Maintenance", 
    "PendingTask", "Product", "StockMovement", "Budget", 
    "BudgetItem", "Payment", "Photo", "Problem", "Solution",
    "Cost"
}
FORBIDDEN_COLUMNS = {"hashed_password", "security_token", "is_superuser", "is_active", "password", "company_id", "is_superadmin"}

def is_valid_model(model_name: str) -> bool:
    return model_name in ALLOWED_TABLES

def get_valid_columns(model_class: Any) -> set:
    mapper = inspect(model_class)
    return {col.name for col in mapper.columns}

def _has_column(model_class: Any, column_name: str) -> bool:
    """Check if a SQLAlchemy model has a specific column."""
    mapper = inspect(model_class)
    return column_name in {col.name for col in mapper.columns}

def cast_value_for_column(model_class: Any, key: str, value: Any) -> Any:
    """Helper to convert generic string inputs (like dates) to Python objects expected by SQLAlchemy."""
    if value is None:
        return None
    try:
        mapper = inspect(model_class)
        if key not in mapper.columns:
            return value
        
        # Use try/except on python_type as some custom types might not have it
        try:
            python_type = mapper.columns[key].type.python_type
        except NotImplementedError:
            return value

        if python_type is datetime.date and isinstance(value, str):
            return datetime.datetime.strptime(value.split("T")[0], "%Y-%m-%d").date()
        elif python_type is datetime.datetime and isinstance(value, str):
            if value.endswith('Z'):
                value = value[:-1] + '+00:00'
            return datetime.datetime.fromisoformat(value)
    except Exception as e:
        logger.warning(f"Could not cast {value} for column {key}: {e}")
    return value

async def create_record(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """Creates a new record for any entity."""
    model_name = tool_input.get("model")
    attributes = tool_input.get("attributes", {})
    
    if not is_valid_model(model_name):
        return json.dumps({"error": f"Model '{model_name}' acts on forbidden or unknown table."})
        
    models = get_models_dict()
    model_class = models.get(model_name)
    
    if not model_class:
        return json.dumps({"error": f"Model '{model_name}' no encontrado."})
    
    valid_columns = get_valid_columns(model_class)
    safe_attributes = {}
    for key, value in attributes.items():
        if key not in valid_columns:
            return json.dumps({"error": f"Column '{key}' doesn't exist on {model_name}."})
        if key in FORBIDDEN_COLUMNS:
            return json.dumps({"error": f"Modifying column '{key}' is forbidden."})
        safe_attributes[key] = cast_value_for_column(model_class, key, value)

    # ── Tenant isolation: auto-inject company_id and created_by ──
    if user and _has_column(model_class, "company_id"):
        safe_attributes.pop("company_id", None)  # Strip AI-provided value
        safe_attributes["company_id"] = user["company_id"]
    if user and _has_column(model_class, "created_by"):
        safe_attributes.pop("created_by", None)
        safe_attributes["created_by"] = user["id"]

    try:
        new_record = model_class(**safe_attributes)
        db.add(new_record)
        await db.commit()
        await db.refresh(new_record)
        
        # Try to return the ID if it has one
        record_id = getattr(new_record, "id", None)
        return json.dumps({
            "success": True, 
            "message": f"Registro '{model_name}' creado con éxito.",
            "id": str(record_id) if record_id else None
        }, ensure_ascii=False)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating {model_name}: {str(e)}")
        return json.dumps({"error": f"Error creando el registro: {str(e)}"}, ensure_ascii=False)


async def update_record(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """Updates an existing record based on filters."""
    model_name = tool_input.get("model")
    filters = tool_input.get("filters", {})
    fields = tool_input.get("fields", {})
    
    if not is_valid_model(model_name):
        return json.dumps({"error": f"Model '{model_name}' acts on forbidden or unknown table."})
        
    if not filters:
        return json.dumps({"error": "Debe proporcionar filtros (ej. id) para actualizar un registro."})
    if not fields:
        return json.dumps({"error": "Debe propocionar campos (fields) a actualizar."})
        
    models = get_models_dict()
    model_class = models.get(model_name)
    
    if not model_class:
        return json.dumps({"error": f"Model '{model_name}' no encontrado."})
    
    valid_columns = get_valid_columns(model_class)
    
    # Check if id or unique primary key is in filters to avoid mass updates
    pk_columns = {col.name for col in inspect(model_class).columns if col.primary_key}
    has_pk_filter = any(pk in filters for pk in pk_columns)
    if not has_pk_filter:
         return json.dumps({"error": "Se requiere incluir un campo de primary_key (como 'id') en los filtros para realizar un update seguro."})
    
    try:
        query = select(model_class)
        # ── Tenant isolation: scope query to company ──
        if user and _has_column(model_class, "company_id"):
            query = query.where(getattr(model_class, "company_id") == user["company_id"])

        for k, v in filters.items():
            if hasattr(model_class, k):
                casted_v = cast_value_for_column(model_class, k, v)
                query = query.where(getattr(model_class, k) == casted_v)
                
        result = await db.execute(query)
        record = result.scalars().first()
        
        if not record:
            return json.dumps({"error": "Registro no encontrado para los filtros dados."})
            
        # Strip tenant fields from update
        fields.pop("company_id", None)
        fields.pop("is_superadmin", None)
        fields.pop("created_by", None)

        for k, v in fields.items():
            if k not in valid_columns:
                return json.dumps({"error": f"Column '{k}' doesn't exist on {model_name}."})
            if k in FORBIDDEN_COLUMNS:
                return json.dumps({"error": f"Modifying column '{k}' is forbidden."})
            
            if hasattr(record, k):
                setattr(record, k, cast_value_for_column(model_class, k, v))
                
        await db.commit()
        return json.dumps({"success": True, "message": f"Registro '{model_name}' actualizado con éxito."}, ensure_ascii=False)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating {model_name}: {str(e)}")
        return json.dumps({"error": f"Error actualizando el registro: {str(e)}"}, ensure_ascii=False)


async def delete_record(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """Deletes an existing record based on filters."""
    model_name = tool_input.get("model")
    filters = tool_input.get("filters", {})
    
    if not is_valid_model(model_name):
        return json.dumps({"error": f"Model '{model_name}' acts on forbidden or unknown table."})
        
    if not filters:
        return json.dumps({"error": "Debe proporcionar filtros (ej. id) para eliminar un registro."})
        
    models = get_models_dict()
    model_class = models.get(model_name)
    
    if not model_class:
        return json.dumps({"error": f"Model '{model_name}' no encontrado."})
        
    # Check if id or unique primary key is in filters to avoid mass deletes
    pk_columns = {col.name for col in inspect(model_class).columns if col.primary_key}
    has_pk_filter = any(pk in filters for pk in pk_columns)
    if not has_pk_filter:
         return json.dumps({"error": "Se requiere incluir un campo de primary_key (como 'id') en los filtros para realizar un delete seguro."})
    
    try:
        query = select(model_class)
        # ── Tenant isolation: scope query to company ──
        if user and _has_column(model_class, "company_id"):
            query = query.where(getattr(model_class, "company_id") == user["company_id"])

        for k, v in filters.items():
            if hasattr(model_class, k):
                casted_v = cast_value_for_column(model_class, k, v)
                query = query.where(getattr(model_class, k) == casted_v)
                
        result = await db.execute(query)
        record = result.scalars().first()
        
        if not record:
            return json.dumps({"error": "Registro no encontrado para los filtros dados."})
            
        await db.delete(record)
        await db.commit()
        return json.dumps({"success": True, "message": f"Registro '{model_name}' eliminado con éxito."}, ensure_ascii=False)
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting {model_name}: {str(e)}")
        return json.dumps({"error": f"Error eliminando el registro: {str(e)}"}, ensure_ascii=False)


async def search_records(tool_input: dict, db: AsyncSession, user: dict = None) -> str:
    """Searches and lists records based on filters."""
    model_name = tool_input.get("model")
    filters = tool_input.get("filters", {})
    limit = tool_input.get("limit", 10)
    
    # Enforce hard limits
    if limit > 50:
        limit = 50
    
    if not is_valid_model(model_name):
        return json.dumps({"error": f"Model '{model_name}' acts on forbidden or unknown table."})
        
    models = get_models_dict()
    model_class = models.get(model_name)
    
    if not model_class:
        return json.dumps({"error": f"Model '{model_name}' no encontrado."})
    
    try:
        query = select(model_class)
        # ── Tenant isolation: scope query to company ──
        if user and _has_column(model_class, "company_id"):
            query = query.where(getattr(model_class, "company_id") == user["company_id"])
            filters.pop("company_id", None)  # Strip AI-provided company filter

        for k, v in filters.items():
            if hasattr(model_class, k) and v is not None:
                # Basic string wildcard matching handling could be improved
                col = getattr(model_class, k)
                if isinstance(v, str) and "%" in v:
                    query = query.where(col.ilike(v))
                else:
                    casted_v = cast_value_for_column(model_class, k, v)
                    query = query.where(col == casted_v)
                    
        query = query.limit(limit)
        result = await db.execute(query)
        records = result.scalars().all()
        
        data = []
        for rec in records:
            # Dynamically convert record properties into dict based on sqlalchemy mapper
            rec_dict = {}
            for col in inspect(model_class).columns:
                val = getattr(rec, col.name)
                # handle non-serializable objects: enums, datetimes, decimals, UUIDs
                if val is not None:
                    if hasattr(val, "value"): # Example for enums
                        val = val.value
                    elif not isinstance(val, (str, int, float, bool, list, dict)):
                        val = str(val)
                rec_dict[col.name] = val
            data.append(rec_dict)
            
        return json.dumps({"records": data, "count": len(data)}, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error searching {model_name}: {str(e)}")
        return json.dumps({"error": f"Error buscando registros: {str(e)}"}, ensure_ascii=False)


CRUD_TOOLS = [
    {
        "name": "create_record",
        "description": "Crear un nuevo registro para cualquier entidad del sistema (Cliente, Instalación, Actividad, Tarea, etc.)",
        "input_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "description": "Nombre exacto del modelo (ej: 'Client', 'Installation', 'Activity', 'Maintenance', 'Product'). Obtené la lista desde describe_database_schema si hay dudas."},
                "attributes": {
                    "type": "object", 
                    "description": "Diccionario clave-valor con los campos del registro. NO incluir company_id ni created_by, se asignan automáticamente."
                }
            },
            "required": ["model", "attributes"]
        }
    },
    {
        "name": "update_record",
        "description": "Actualizar un registro existente seleccionando sus filtros.",
        "input_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "description": "Nombre exacto del modelo (ej: 'Client', 'Installation')."},
                "filters": {
                    "type": "object", 
                    "description": "Filtros para encontrar el registro, usualmente {'id': 'uuid-de-registro'}."
                },
                "fields": {
                    "type": "object", 
                    "description": "Diccionario clave-valor con únicamente los campos que deben ser actualizados."
                }
            },
            "required": ["model", "filters", "fields"]
        }
    },
    {
        "name": "delete_record",
        "description": "Eliminar un registro existente de la base de datos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "description": "Nombre exacto del modelo."},
                "filters": {
                    "type": "object", 
                    "description": "Filtros para encontrar el registro, usualmente {'id': 'uuid-de-registro'}."
                }
            },
            "required": ["model", "filters"]
        }
    },
    {
        "name": "search_records",
        "description": "Buscar y listar registros en la base de datos de manera dinámica.",
        "input_schema": {
            "type": "object",
            "properties": {
                "model": {"type": "string", "description": "Nombre exacto del modelo (ej. 'Installation')."},
                "filters": {
                    "type": "object", 
                    "description": "Filtros de búsqueda (ej. {'status': 'pending'} o {'name': '%Juan%'}). Usar % para comodines en strings. NO incluir company_id, se filtra automáticamente."
                },
                "limit": {"type": "integer", "description": "Máximo de registros a retornar (default: 50)."},
                "order_by": {"type": "string", "description": "Campo por el cual ordenar los resultados (ej. 'created_at')."}
            },
            "required": ["model"]
        }
    },
]
