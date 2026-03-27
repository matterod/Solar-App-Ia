"""
Shared Sol agent chat loop.

Used by both the web API (routers/agent.py) and the Telegram webhook
(routers/telegram.py) so the exact same AI behaviour runs in both channels.
"""

import logging

import anthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User as UserModel
from app.services.agent.tool_registry import get_tools, execute_tool
from app.services.agent.compression import compress_tool_result

logger = logging.getLogger(__name__)

# ── System prompt (single source of truth) ───────────────────────────────────

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
16. BASE DE CONOCIMIENTO (Problemas/Soluciones): Podés registrar y aprender de problemas y soluciones pasadas usando los modelos Problem y Solution. Si te piden anotar un problema, USÁ SIEMPRE la herramienta `add_problem`. Esta herramienta registra el problema y opcionalmente su solución en un solo paso atómico.
17. MULTI-TENANT: Este sistema es multi-empresa. NUNCA proporciones ni incluyas `company_id` en los atributos al crear o buscar registros — se asigna automáticamente según tu empresa. Tampoco incluyas `created_by`, se asigna según el usuario actual.
18. SEGURIDAD: Nunca intentes acceder, buscar, ni modificar datos de tablas internas como Company, User o CompanyInvitation.
19. CONFIRMACIÓN: NUNCA respondas con un mensaje de éxito (ej. "✅ Registrado", "✅ Guardado") si no ejecutaste previamente la tool correspondiente en esta misma conversación. Si el usuario pide registrar, crear, guardar o modificar algo, PRIMERO llamá la tool, DESPUÉS confirmá. Una respuesta de texto sola sin tool call previa es SIEMPRE incorrecta para operaciones de escritura.
20. TAREAS: Para crear tareas (pendientes, recordatorios, actividades a realizar) usá `create_task`. Para marcar una tarea como completada usá `complete_task(task_id)`. Para ver o listar tareas usá `list_tasks`. Las tareas recurrentes no tienen fecha límite (`is_recurring=True`); las tareas con fecha concreta son de tipo "deadline" (`is_recurring=False`, con `due_date`).

FORMATO DE RESPUESTA (CRÍTICO):
- NUNCA uses markdown: sin asteriscos (**texto**), sin guiones como viñetas (- item), sin títulos con # ni ##.
- Usá texto plano. Para listas, numerá con "1.", "2.", etc.
- Para destacar algo importante, usá emojis (✅, ⚠️, 📦) en lugar de negritas.
- Tus respuestas se muestran en Telegram y en una web — ninguno renderiza markdown correctamente.
"""


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _reactive_loop(
    messages: list,
    system_blocks: list,
    tools: list,
    db,
    current_user: dict,
    client: anthropic.Anthropic,
) -> tuple[str, list]:
    """
    Iterative tool-calling loop — max 10 rounds.

    This is the original reactive loop extracted verbatim from run_agent_chat()
    so it can be called both directly (fallback) and from the plan-and-execute
    routing branch.  Zero behaviour change.
    """
    tool_calls_log: list[dict] = []

    for _ in range(10):
        try:
            response = client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=4096,
                system=system_blocks,
                tools=tools,
                tool_choice={"type": "auto"},
                messages=messages,
            )
        except anthropic.APIError as e:
            logger.error(f"Anthropic API error: {e}")
            return f"Error al conectar con la IA: {e}", tool_calls_log

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    logger.info(f"[Sol tool] {block.name}({block.input})")
                    tool_calls_log.append({"tool": block.name, "input": block.input})
                    raw_result = await execute_tool(block.name, block.input, db, user=current_user)
                    logger.debug(f"[Sol raw] {block.name}: {raw_result[:300]}")
                    result = compress_tool_result(block.name, raw_result)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "user", "content": tool_results})

        else:
            # Final answer — extract text
            text = "".join(
                str(block.text) for block in response.content if hasattr(block, "text")
            )

            # Increment usage counter
            user_result = await db.execute(
                select(UserModel).where(UserModel.id == current_user["id"])
            )
            user_obj = user_result.scalar_one_or_none()
            if user_obj:
                user_obj.message_count += 1
                await db.commit()

            return text, tool_calls_log

    # Exhausted iterations
    return (
        "Disculpá, la tarea fue muy larga y no pude completarla. "
        "Por favor detallame qué quedó pendiente.",
        tool_calls_log,
    )


# ── Core agent loop ───────────────────────────────────────────────────────────

async def run_agent_chat(
    message: str,
    history: list[dict],
    current_user: dict,
    db: AsyncSession,
) -> tuple[str, list[dict]]:
    """
    Run the Sol agent loop and return (response_text, tool_calls_log).

    Single implementation shared by the web endpoint and the Telegram webhook.
    """
    settings = get_settings()
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    messages: list[dict] = []
    for h in history[-20:]:
        role = h.get("role")
        content = h.get("content")
        if role in ("user", "assistant") and content:
            if messages and messages[-1]["role"] == role:
                messages[-1]["content"] += f"\n\n{content}"
            else:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    system = (
        SYSTEM_PROMPT
        + f"\n\nContexto actual: Estás asistiendo a {current_user['full_name']} "
        f"de la empresa '{current_user['company_name']}'. "
        "No necesitás preguntar el company_id ni el nombre de la empresa.\n"
        "REGLA CRÍTICA DE HISTORIAL: El historial de conversación puede contener confirmaciones "
        "de texto de acciones pasadas (ej. '✅ Problema registrado'). NUNCA uses esas confirmaciones "
        "como evidencia de que una acción ya fue ejecutada en el turno ACTUAL. "
        "Si el usuario pide registrar, crear o guardar algo en ESTE mensaje, SIEMPRE llamá la tool "
        "correspondiente sin importar qué diga el historial previo. "
        "El historial es solo contexto — no es prueba de ejecución."
    )

    system_blocks = [{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}]

    tools = get_tools()
    tools = tools[:-1] + [{**tools[-1], "cache_control": {"type": "ephemeral"}}]

    return await _reactive_loop(messages, system_blocks, tools, db, current_user, client)
