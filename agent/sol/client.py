"""
Sol Agent — Backend API Client

Executes tool calls by making HTTP requests to the FastAPI backend.
The agent NEVER accesses the database directly.
"""

import httpx
from sol.config import settings


class BackendClient:
    """HTTP client for the Solar ERP backend API."""

    def __init__(self, token: str | None = None):
        self.base_url = f"{settings.backend_url}/api/v1"
        self.token = token
        self.client = httpx.AsyncClient(timeout=30.0)

    @property
    def headers(self) -> dict:
        h = {"Content-Type": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    async def execute_tool(self, tool_name: str, tool_input: dict) -> dict:
        """Route a tool call to the correct backend endpoint."""
        handlers = {
            "search_installations": self._search_installations,
            "get_installation_detail": self._get_installation_detail,
            "create_activity": self._create_activity,
            "schedule_maintenance": self._schedule_maintenance,
            "get_upcoming_maintenance": self._get_upcoming_maintenance,
            "create_task": self._create_task,
            "search_products": self._search_products,
            "get_dashboard_stats": self._get_dashboard_stats,
            "search_clients": self._search_clients,
        }

        handler = handlers.get(tool_name)
        if not handler:
            return {"error": f"Tool desconocido: {tool_name}"}

        try:
            return await handler(tool_input)
        except httpx.HTTPStatusError as e:
            return {"error": f"Error HTTP {e.response.status_code}: {e.response.text}"}
        except httpx.ConnectError:
            return {"error": "No se pudo conectar al backend. ¿Está corriendo?"}
        except Exception as e:
            return {"error": f"Error inesperado: {str(e)}"}

    async def _search_installations(self, params: dict) -> dict:
        resp = await self.client.get(
            f"{self.base_url}/installations/",
            params={k: v for k, v in params.items() if v is not None},
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"installations": resp.json()}

    async def _get_installation_detail(self, params: dict) -> dict:
        resp = await self.client.get(
            f"{self.base_url}/installations/{params['installation_id']}",
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"installation": resp.json()}

    async def _create_activity(self, params: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/activities/",
            json=params,
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"activity_created": resp.json()}

    async def _schedule_maintenance(self, params: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/maintenance/",
            json=params,
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"maintenance_scheduled": resp.json()}

    async def _get_upcoming_maintenance(self, params: dict) -> dict:
        days = params.get("days", 30)
        resp = await self.client.get(
            f"{self.base_url}/maintenance/",
            params={"upcoming_days": days},
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"upcoming_maintenance": resp.json()}

    async def _create_task(self, params: dict) -> dict:
        resp = await self.client.post(
            f"{self.base_url}/tasks/",
            json=params,
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"task_created": resp.json()}

    async def _search_products(self, params: dict) -> dict:
        query_params = {}
        if params.get("query"):
            query_params["query"] = params["query"]
        if params.get("low_stock_only"):
            query_params["low_stock"] = "true"
        resp = await self.client.get(
            f"{self.base_url}/products/",
            params=query_params,
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"products": resp.json()}

    async def _get_dashboard_stats(self, params: dict) -> dict:
        resp = await self.client.get(
            f"{self.base_url}/dashboard/stats",
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"stats": resp.json()}

    async def _search_clients(self, params: dict) -> dict:
        resp = await self.client.get(
            f"{self.base_url}/clients/",
            params={k: v for k, v in params.items() if v is not None},
            headers=self.headers,
        )
        resp.raise_for_status()
        return {"clients": resp.json()}

    async def close(self):
        await self.client.aclose()
