---
description: Solar ERP system architecture — strict rules for consistent development
---

# Solar ERP — Architecture Skill

## System Architecture

```
Frontend (Next.js :3000)
        │
        ▼
Backend API (FastAPI :8000)
        │
        ▼
Database (PostgreSQL :5432)

Additional Services:
  • AI Agent (Sol) — tool-based, API-only access
  • Photo Storage — S3-compatible (Cloudflare R2)
  • WhatsApp Integration — API-ready
  • Scheduler — maintenance reminders
```

## Strict Rules

1. **Frontend → Backend only**: The frontend NEVER accesses the database directly. All data flows through the FastAPI backend REST API.

2. **AI Agent → Backend only**: The AI agent Sol MUST interact with the system exclusively through backend API endpoints. It NEVER accesses the database directly.

3. **API versioning**: All API routes are under `/api/v1/`.

4. **Service ports**: Frontend `:3000`, Backend `:8000`, Database `:5432`.

5. **Docker**: All services run via Docker Compose. Every new service must be added to `docker-compose.yml`.

6. **Photo storage**: Photos are stored in S3-compatible storage. Only metadata (S3 keys, bucket, content type) is stored in PostgreSQL.

## Technology Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | Next.js, React, TypeScript, TailwindCSS, Framer Motion |
| Backend   | FastAPI, Python, SQLAlchemy, Pydantic                  |
| Database  | PostgreSQL                                             |
| AI Agent  | LLM with tool-based API integration                    |
| Storage   | S3-compatible (Cloudflare R2)                          |
| Messaging | WhatsApp API                                           |
| Infra     | Docker, Docker Compose                                 |

## Project Structure

```
solar-erp/
├── frontend/          # Next.js app
├── backend/           # FastAPI app
│   └── app/
│       ├── models/    # SQLAlchemy models
│       ├── schemas/   # Pydantic schemas
│       ├── routers/   # API endpoints (includes agent.py)
│       ├── services/  # Business logic & agent tools
│       │   └── agent/ # Tool registry, CRUD tools, schema inspector
│       ├── auth.py    # Authentication
│       ├── config.py  # Settings
│       ├── database.py
│       └── main.py
├── database/          # SQL init scripts
│   └── init/
├── docker/            # Dockerfiles
├── .agent/skills/     # Antigravity skills
├── docker-compose.yml
└── README.md
```

## When adding new features:

1. Create the database model in `backend/app/models/`
2. Create the Pydantic schema in `backend/app/schemas/`
3. Create the API router in `backend/app/routers/`
4. Register the router in `backend/app/main.py`
5. If the agent needs a new tool, create it in `backend/app/services/` and register it in `backend/app/services/agent/tool_registry.py`
6. Create the frontend page in `frontend/src/app/dashboard/`
