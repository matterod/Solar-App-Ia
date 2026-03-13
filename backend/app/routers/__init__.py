"""
Solar ERP — API Routers
"""

from app.routers.auth import router as auth_router
from app.routers.clients import router as clients_router
from app.routers.installations import router as installations_router
from app.routers.activities import router as activities_router
from app.routers.maintenance import router as maintenance_router
from app.routers.tasks import router as tasks_router
from app.routers.products import router as products_router
from app.routers.stock import router as stock_router
from app.routers.dashboard import router as dashboard_router
from app.routers.agent import router as agent_router
from app.routers.problems import router as problems_router
from app.routers.invitations import router as invitations_router
from app.routers.team import router as team_router
