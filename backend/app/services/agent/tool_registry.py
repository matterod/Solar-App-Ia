import json
import logging
from typing import Any, Callable, Dict, List, Optional
import inspect

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agent.schema_inspector import SCHEMA_INSPECTOR_TOOL, PREVIEW_TABLE_DATA_TOOL, describe_database_schema, preview_table_data
from app.services.agent.crud_tools import CRUD_TOOLS, create_record, update_record, delete_record, search_records
from app.services.dashboard_service import GET_DASHBOARD_STATS_TOOL, get_dashboard_stats
from app.services.inventory_service import UPDATE_STOCK_TOOL, update_stock
from app.services.maintenance_service import SCHEDULE_MAINTENANCE_TOOL, GET_UPCOMING_MAINTENANCE_TOOL, schedule_maintenance, get_upcoming_maintenance

logger = logging.getLogger(__name__)

class AgentTool(BaseModel):
    name: str
    description: str
    category: str = Field(description="Category of the tool, e.g., 'database', 'inventory', 'maintenance'")
    input_schema: dict
    handler: Callable = Field(exclude=True)

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, AgentTool] = {}

    def register(self, tool: AgentTool):
        self._tools[tool.name] = tool

    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """Returns schemas formatted exactly for Anthropic's Claude API."""
        return [
            {
                "name": t.name,
                "description": f"[{t.category.upper()}] {t.description}",
                "input_schema": t.input_schema
            } for t in self._tools.values()
        ]

    async def execute(self, tool_name: str, tool_input: dict, db: AsyncSession) -> str:
        """Executes a registered tool dynamically."""
        if tool_name not in self._tools:
            err = f"Tool desconocido o no registrado: {tool_name}"
            logger.error(err)
            return json.dumps({"error": err}, ensure_ascii=False)
            
        tool = self._tools[tool_name]
        handler = tool.handler
        
        try:
            # Check if the handler is async
            if inspect.iscoroutinefunction(handler):
                if "db" in inspect.signature(handler).parameters:
                    return await handler(tool_input, db)
                return await handler(tool_input)
            else:
                if "db" in inspect.signature(handler).parameters:
                    return handler(tool_input, db)
                return handler(tool_input)
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {e}")
            return json.dumps({"error": f"Error interno en herramienta {tool_name}: {str(e)}"}, ensure_ascii=False)

# Singleton registry
registry = ToolRegistry()

# Register Schema tools
registry.register(AgentTool(
    name=SCHEMA_INSPECTOR_TOOL["name"],
    description=SCHEMA_INSPECTOR_TOOL["description"],
    category="database_schema",
    input_schema=SCHEMA_INSPECTOR_TOOL["input_schema"],
    handler=describe_database_schema
))

registry.register(AgentTool(
    name=PREVIEW_TABLE_DATA_TOOL["name"],
    description=PREVIEW_TABLE_DATA_TOOL["description"],
    category="database_schema",
    input_schema=PREVIEW_TABLE_DATA_TOOL["input_schema"],
    handler=preview_table_data
))

# Register CRUD tools
for tool_schema in CRUD_TOOLS:
    name = tool_schema["name"]
    handler = {
        "create_record": create_record,
        "update_record": update_record,
        "delete_record": delete_record,
        "search_records": search_records,
    }[name]
    
    registry.register(AgentTool(
        name=name,
        description=tool_schema["description"],
        category="database_crud",
        input_schema=tool_schema["input_schema"],
        handler=handler
    ))

# Register Domain Tools
registry.register(AgentTool(
    name=GET_DASHBOARD_STATS_TOOL["name"],
    description=GET_DASHBOARD_STATS_TOOL["description"],
    category="dashboard",
    input_schema=GET_DASHBOARD_STATS_TOOL["input_schema"],
    handler=get_dashboard_stats
))

registry.register(AgentTool(
    name=UPDATE_STOCK_TOOL["name"],
    description=UPDATE_STOCK_TOOL["description"],
    category="inventory",
    input_schema=UPDATE_STOCK_TOOL["input_schema"],
    handler=update_stock
))

registry.register(AgentTool(
    name=SCHEDULE_MAINTENANCE_TOOL["name"],
    description=SCHEDULE_MAINTENANCE_TOOL["description"],
    category="maintenance",
    input_schema=SCHEDULE_MAINTENANCE_TOOL["input_schema"],
    handler=schedule_maintenance
))

registry.register(AgentTool(
    name=GET_UPCOMING_MAINTENANCE_TOOL["name"],
    description=GET_UPCOMING_MAINTENANCE_TOOL["description"],
    category="maintenance",
    input_schema=GET_UPCOMING_MAINTENANCE_TOOL["input_schema"],
    handler=get_upcoming_maintenance
))

# Helper functions for the router
def get_tools() -> List[Dict[str, Any]]:
    return registry.get_tool_schemas()

async def execute_tool(tool_name: str, tool_input: dict, db: AsyncSession) -> str:
    return await registry.execute(tool_name, tool_input, db)

