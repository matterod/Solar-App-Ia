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
│       ├── routers/   # API endpoints
│       ├── auth.py    # Authentication
│       ├── config.py  # Settings
│       ├── database.py
│       └── main.py
├── agent/             # AI Agent "Sol"
│   └── sol/
│       ├── tools.py   # Tool definitions
│       ├── client.py  # Backend API client
│       ├── config.py
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
5. Add any new tool definitions in `agent/sol/tools.py`
6. Add the API method in `agent/sol/client.py`
7. Create the frontend page in `frontend/src/app/dashboard/`
