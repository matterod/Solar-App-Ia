"""
Agent router — Real Claude AI integration.

This router embeds the Sol agent directly in the backend,
using Anthropic's Claude API with tool calling.
Claude calls tools → tools hit the backend's own API internally.
"""

import logging
from typing import Optional

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models.user import User as UserModel
from app.services.plan_limits import check_limit

# Import the extracted tools definition and execution logic
from app.services.agent.tool_registry import get_tools, execute_tool, registry, AgentTool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["AI Agent"])

SYSTEM_PROMPT = """Eres Sol ☀️, un asistente de inteligencia artificial especializado en gestión de energía solar y un empleado operativo de la empresa.

Tu rol es gestionar los datos operativos del negocio. TENÉS LA CAPACIDAD Y LA RESPONSABILIDAD de:
- Crear, buscar y modificar información de Clientes e Instalaciones.
- Registrar detalles técnicos, equipos usados (inversores, paneles, baterías) y potencia de las instalaciones.
- Programar mantenimientos en el futuro.
- Modificar stock en inventario y registrar actividades o bitácoras.

REGLAS DE OPERACIÓN:
1. Siempre respondés en español argentino (usá "vos").
2. Sos un ASISTENTE OPERATIVO. Si el usuario te indica que algo sucedió (ej. "creá un cliente", "terminamos una instalación", "instalamos un inversor"), ASUMÍ que debés reflejarlo en la base de datos haciendo uso de las tools.
3. El proceso mental para un evento del mundo real (ej. instalación completada) debería ser:
   - Buscar si el cliente existe. Si no, crearlo.
   - Crear el registro de la instalación vinculado a ese cliente, con la ubicación y equipos instalados.
   - (Opcional) Si te informan que se usaron productos específicos, podés buscar el producto en stock y hacer un "outgoing" movement.
   - (Opcional) Programar un mantenimiento para 6/12 meses si es la política estándar o te lo piden.
4. Cuando busques datos, usá las herramientas. NUNCA inventes IDs ni inventes datos sin confirmar.
5. Para correcciones ("Me equivoqué, el inversor no era X, era Y"), verificá el ID de la instalación y usá la tool de update.
6. Notificá al usuario, de manera concisa y clara, cada acción que tomaste exitosamente (ej. "✅ Cliente Juan Pedro creado. ✅ Instalación registrada con 6 paneles.").
7. Entendé el contexto: los "equipos" están dentro de los objetos de instalación (modelos de panel, inversor), o en inventario.
8. Los clientes son personas, no empresas.
9. Si te pido agregar varias instalaciones, no crees muchos clientes. EL cliente solo es uno y puede tener varias instalaciones.

REGLAS DE USO DE HERRAMIENTAS (CRITICO):
10. DESCUBRIMIENTO: Si no estás seguro del esquema de un modelo, DEBES usar `describe_database_schema` antes de intentar crear o actualizar un registro.
11. PREVISUALIZACIÓN: Si no sabés qué formato toma una variable (ej. formato de una fecha o choices de un Enum), usá `preview_table_data(table_name)` para evitar alucinaciones.
12. IDEMPOTENCIA: Antes de crear un registro (como un Cliente), SIEMPRE llamá a `search_records` para asegurar de que no exista previamente. Si existe, reusá su ID.
13. DOMINIO > CRUD: Si existe un tool específico para el dominio (ej. `schedule_maintenance`, `update_stock`), DEBES usarlo por sobre un CRUD genérico para que la lógica de negocio se aplique correctamente.
14. RELACIONES: Para saber qué instalaciones tiene un cliente específico, primero buscá su `id` en `Client` por nombre, y luego buscá en `Installation` filtrando por `client_id`.
15. UBICACIONES: Una misma ubicación (como "La Rinconada" o un country/barrio cerrado) puede tener varias instalaciones correspondientes a distintos clientes. Para buscar por lugar o barrio, usá `search_records(model="Installation")` con el filtro `location_name` usando comodines (ej. `{"location_name": "%Rinconada%"}`).
16. BASE DE CONOCIMIENTO (Problemas/Soluciones): Podés registrar y aprender de problemas y soluciones pasadas usando los modelos `Problem` y `Solution`. Si te piden anotar un problema, usa `create_record(model="Problem")`, y si también hay solución, agregala usando `create_record(model="Solution")` vinculada por `problem_id`. Al buscar soluciones para dar consejos, buscá en estos registros primero.
"""

# ── Request / Response Models ──

class AgentMessage(BaseModel):
    message: str
    history: list[dict] = []
    context: Optional[dict] = None


class AgentResponse(BaseModel):
    response: str
    tool_calls: list = []
    metadata: Optional[dict] = None


# ── Main Chat Endpoint ──

@router.post("/chat", response_model=AgentResponse)
async def chat_with_agent(
    message: AgentMessage,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _limit=Depends(check_limit("ai_questions")),
):
    """Send a message to Sol and get an AI-powered response."""
    settings = get_settings()

    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key no configurada. Agregá ANTHROPIC_API_KEY al archivo .env"
        )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    
    # Build alternating message history
    messages = []
    for h in message.history[-20:]:  # Keep last 20 messages for context size
        role = h.get("role")
        content = h.get("content")
        if role in ["user", "assistant"] and content:
            if messages and messages[-1]["role"] == role:
                messages[-1]["content"] += f"\n\n{content}"
            else:
                messages.append({"role": role, "content": content})

    # Add the current message
    if messages and messages[-1]["role"] == "user":
        messages[-1]["content"] += f"\n\n{message.message}"
    else:
        messages.append({"role": "user", "content": message.message})

    tool_calls_log = []

    # Iterative tool-calling loop (max 10 iterations)
    for _ in range(10):
        try:
            response = client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                tools=get_tools(),
                messages=messages,
            )
        except anthropic.APIError as e:
            logger.error(f"Anthropic API Error: {e}")
            raise HTTPException(status_code=502, detail=f"Error de Anthropic API: {str(e)}")

        if response.stop_reason == "tool_use":
            # Claude wants to call tools
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    logger.info(f"Agent tool call: {block.name}({block.input})")
                    tool_calls_log.append({"tool": block.name, "input": block.input})
                    result = await execute_tool(block.name, block.input, db, user=current_user)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "user", "content": tool_results})
        else:
            # Final text response
            text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    text += str(block.text)

            # Record usage
            user_result = await db.execute(select(UserModel).where(UserModel.id == current_user["id"]))
            user_obj = user_result.scalar_one()
            user_obj.message_count += 1
            await db.commit()

            return AgentResponse(
                response=text,
                tool_calls=tool_calls_log,
                metadata={
                    "model": "claude-haiku-4-5",
                    "user": current_user["email"]
                },
            )
    
    return AgentResponse(
        response="Disculpá, la tarea fue muy larga y no pude completarla a tiempo. Por favor detallame qué quedó pendiente.",
        tool_calls=tool_calls_log,
    )
