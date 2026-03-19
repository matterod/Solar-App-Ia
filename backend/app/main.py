"""
Solar ERP — Main Application Entry Point
FastAPI application with all routers and middleware.
"""

import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    auth_router,
    clients_router,
    installations_router,
    activities_router,
    maintenance_router,
    tasks_router,
    products_router,
    stock_router,
    dashboard_router,
    agent_router,
    problems_router,
    invitations_router,
    team_router,
    costs_router,
    budgets_router,
    plan_router,
    telegram_webhook_router,
    telegram_api_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown events."""
    # Startup
    print("☀️  Solar ERP Backend starting...")
    print(f"   Debug mode: {settings.debug}")
    print(f"   CORS origins: {settings.get_cors_origins()}")
    yield
    # Shutdown
    print("☀️  Solar ERP Backend shutting down...")


app = FastAPI(
    title="Solar ERP API",
    description="REST API for the Solar Energy Management Platform",
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(clients_router, prefix=API_PREFIX)
app.include_router(installations_router, prefix=API_PREFIX)
app.include_router(activities_router, prefix=API_PREFIX)
app.include_router(maintenance_router, prefix=API_PREFIX)
app.include_router(tasks_router, prefix=API_PREFIX)
app.include_router(products_router, prefix=API_PREFIX)
app.include_router(stock_router, prefix=API_PREFIX)
app.include_router(dashboard_router, prefix=API_PREFIX)
app.include_router(agent_router, prefix=API_PREFIX)
app.include_router(problems_router, prefix=API_PREFIX)
app.include_router(invitations_router, prefix=API_PREFIX)
app.include_router(team_router, prefix=API_PREFIX)
app.include_router(costs_router, prefix=API_PREFIX)
app.include_router(budgets_router, prefix=API_PREFIX)
app.include_router(plan_router, prefix=API_PREFIX)
app.include_router(telegram_webhook_router, prefix=API_PREFIX)
app.include_router(telegram_api_router, prefix=API_PREFIX)


@app.get("/")
async def root():
    """Root endpoint — health check."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring."""
    return {"status": "healthy"}
