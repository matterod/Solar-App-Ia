"""
Sol ☀️ — AI Agent for Solar ERP
Uses Anthropic Claude API with tool calling.

The agent loop:
1. User sends a message
2. Claude processes it (may request tool calls)
3. If tool calls → execute via backend API
4. Feed results back to Claude
5. Repeat until Claude gives a final text response
"""

import json
import anthropic

from sol.config import settings
from sol.tools import TOOLS
from sol.client import BackendClient

SYSTEM_PROMPT = """Eres Sol ☀️, un asistente de inteligencia artificial especializado en gestión de energía solar.

Trabajás para una empresa de instalaciones solares. Tu rol es ayudar al equipo a:
- Buscar información de instalaciones, clientes y mantenimientos
- Registrar actividades y tareas
- Consultar el inventario de productos
- Programar mantenimientos
- Analizar estadísticas del negocio

REGLAS:
1. Siempre respondés en español argentino (podés usar "vos" en lugar de "tú")
2. Sé conciso pero útil. No repitas información innecesaria.
3. Cuando busques datos, usá las herramientas disponibles. NUNCA inventes datos.
4. Si no encontrás resultados, decilo claramente.
5. Formateá los datos importantes de manera clara (usá listas, negritas cuando sea útil).
6. Si el usuario pide algo que no podés hacer con las herramientas disponibles, explicale qué sí podés hacer.
7. Sos amable y profesional, pero también natural y cercano.

Ejemplo de tono:
- "Encontré 3 instalaciones en Mendoza. Acá te las muestro..."
- "¡Listo! Ya registré la actividad en la instalación de González."
- "No encontré ninguna instalación con ese nombre. ¿Querés que busque por cliente?"
"""


class SolAgent:
    """Claude-powered agent with tool calling."""

    def __init__(self, auth_token: str | None = None):
        self.anthropic = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.backend = BackendClient(token=auth_token)
        self.conversation_history: list[dict] = []

    async def chat(self, user_message: str) -> str:
        """Process a user message and return Sol's response."""

        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message,
        })

        # Iterative tool-calling loop
        for iteration in range(settings.max_iterations):
            response = self.anthropic.messages.create(
                model=settings.model,
                max_tokens=settings.max_tokens,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=self.conversation_history,
            )

            # Check if Claude wants to use tools
            if response.stop_reason == "tool_use":
                # Add Claude's response (contains tool_use blocks)
                self.conversation_history.append({
                    "role": "assistant",
                    "content": response.content,
                })

                # Execute each tool call
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        print(f"  🔧 Tool: {block.name}({json.dumps(block.input, ensure_ascii=False)})")
                        result = await self.backend.execute_tool(block.name, block.input)
                        print(f"  ✅ Result: {json.dumps(result, ensure_ascii=False)[:200]}...")
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result, ensure_ascii=False, default=str),
                        })

                # Feed tool results back to Claude
                self.conversation_history.append({
                    "role": "user",
                    "content": tool_results,
                })

            else:
                # Claude gave a final text response
                assistant_text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        assistant_text += block.text

                # Add to history
                self.conversation_history.append({
                    "role": "assistant",
                    "content": assistant_text,
                })

                return assistant_text

        return "Disculpá, llegué al límite de iteraciones. ¿Podés reformular tu consulta?"

    def reset(self):
        """Clear conversation history."""
        self.conversation_history = []

    async def close(self):
        """Cleanup resources."""
        await self.backend.close()


# ── CLI for testing ──────────────────────────────────────────

async def _cli():
    """Interactive CLI for testing the agent."""
    import asyncio

    print("=" * 50)
    print("  ☀️  Sol — Asistente de Energía Solar")
    print("  Escribí 'salir' para terminar")
    print("  Escribí 'reset' para nueva conversación")
    print("=" * 50)

    agent = SolAgent()

    try:
        while True:
            user_input = input("\n👤 Vos: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("salir", "exit", "quit"):
                print("\n☀️ ¡Hasta luego!")
                break
            if user_input.lower() == "reset":
                agent.reset()
                print("🔄 Conversación reiniciada.")
                continue

            print("\n☀️ Sol: ", end="", flush=True)
            response = await agent.chat(user_input)
            print(response)
    finally:
        await agent.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(_cli())
