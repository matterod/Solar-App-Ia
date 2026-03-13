# ☀️ Solar ERP — Solar Energy Management Platform

> An ERP-like platform with AI Agent assistant for solar energy companies.

## Architecture

```
Frontend (Next.js :3000)
        │
        ▼
Backend API (FastAPI :8000)
        │
        ▼
Database (PostgreSQL :5432)

Additional Services:
  • AI Agent (Sol)
  • Photo Storage (S3-compatible)
  • WhatsApp Integration
  • Scheduler (maintenance reminders)
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Run with Docker Compose

```bash
# From project root
docker compose up --build
```

### Access

| Service     | URL                        |
| ----------- | -------------------------- |
| Frontend    | http://localhost:3000      |
| Backend API | http://localhost:8000      |
| API Docs    | http://localhost:8000/docs |
| Database    | localhost:5432             |

## Project Structure

```
solar-erp/
├── frontend/          # Next.js + React + TypeScript + TailwindCSS
├── backend/           # FastAPI + SQLAlchemy + Pydantic
├── agent/             # AI Agent "Sol" — tool-based LLM assistant
├── database/          # SQL migrations and seed data
├── docker/            # Dockerfiles for each service
├── .agent/skills/     # Antigravity development skills
├── docker-compose.yml
└── README.md
```

## Technology Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | Next.js, React, TypeScript, TailwindCSS, Framer Motion |
| Backend   | FastAPI, Python, SQLAlchemy, Pydantic                  |
| Database  | PostgreSQL                                             |
| AI Agent  | LLM Agent with tool-based API integration              |
| Storage   | S3-compatible (Cloudflare R2)                          |
| Messaging | WhatsApp API integration                               |
| Infra     | Docker, Docker Compose                                 |

## User Roles

| Role       | Access                                 |
| ---------- | -------------------------------------- |
| Admin      | Full access                            |
| Partner    | Full access (Company level)            |
| Installer  | Installations, activities, maintenance |
| Accountant | Financials, budgets, payments          |

## AI Agent — Sol

Sol is an AI assistant that interacts with the platform via backend API tools:

- `search_installation` — Find installations by client or location
- `create_activity` — Log activities for installations
- `register_maintenance` — Schedule maintenance tasks
- `create_pending_task` — Add pending tasks
- `query_stock` — Check inventory levels
- `create_installation` — Register new installations

Sol **never** accesses the database directly. All interactions go through the FastAPI backend.

## Development Principles

- Modular architecture
- Clean code with strict typing
- Scalable services
- Consistent API structure
- Full documentation

## License

Proprietary — Internal use only.
# Solar-App-Ia
