# Sol (Solar ERP)

Sol es un ERP completo diseñado específicamente para empresas instaladoras de paneles solares. Permite gestionar clientes, presupuestos, instalaciones, mantenimientos, inventario y más, todo unificado bajo una misma plataforma.

## Arquitectura Modular (Microservicios)

El proyecto está diseñado con una arquitectura modular utilizando múltiples backends para separar responsabilidades de manera limpia y escalable. 

Actualmente, el sistema se divide en los siguientes componentes principales:

### 1. Frontend (`/frontend`)
- **Framework:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Responsabilidad:** Proveer la interfaz de usuario para que los instaladores y administradores interactúen con el sistema.

### 2. Core API Backend (`/backend-node`)
- **Framework:** Node.js con Express
- **Lenguaje:** TypeScript
- **ORM:** Sequelize
- **Responsabilidad:** Es el cerebro operativo principal. Maneja las operaciones CRUD de base de datos (clientes, inventario, instalaciones, etc.), la autenticación (vía Firebase Auth) y las validaciones de negocio.

### 3. AI & Data Backend (`/backend` - *En migración/desacople*)
- **Framework:** FastAPI (Python)
- **Responsabilidad:** Anteriormente manejaba todo el backend. Actualmente, su rol se está redirigiendo para especializarse exclusivamente en **tareas pesadas, integraciones externas y Machine Learning**:
  - **Agente IA (Claude):** Interacción por chat para asistir a los usuarios.
  - **Generación de PDFs:** Armado de documentos de presupuestos complejos.
  - **Webhooks de Telegram:** Integración con el bot de notificaciones para los instaladores.

### 4. Base de Datos
- **Motor:** PostgreSQL 16
- **Responsabilidad:** Almacenamiento relacional de todas las entidades del negocio.

## ¿Por qué dos backends?

Tener el **Core API en Node.js** (tipado con TypeScript) y el **AI/Workers en Python** es un patrón arquitectónico de microservicios muy común y robusto. Nos permite:
- **Compartir código y tipado:** Frontend y Backend (Node) hablan en TypeScript (compartiendo interfaces y convenciones como `camelCase`).
- **Especialización:** Python es indiscutiblemente el mejor ecosistema para procesamiento de IA (Agentes, LLMs) y generación de PDFs o tareas asíncronas pesadas. Node.js es superior manejando miles de requests simultáneos de una API transaccional.

## Ejecución Local (Docker)

El proyecto está completamente contenerizado para un despliegue y desarrollo sin fricciones.

```bash
# Levantar toda la infraestructura (Base de datos, Backend Node, Frontend Next.js)
docker compose up -d --build
```
