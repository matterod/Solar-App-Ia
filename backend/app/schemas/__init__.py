"""
Solar ERP — Pydantic Schemas
Request/Response models for the API.
"""

from app.schemas.user import UserCreate, UserRead, UserUpdate, Token, TokenData
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.schemas.installation import InstallationCreate, InstallationRead, InstallationUpdate, InstallationDetail
from app.schemas.activity import ActivityCreate, ActivityRead
from app.schemas.maintenance import MaintenanceCreate, MaintenanceRead, MaintenanceUpdate
from app.schemas.pending_task import PendingTaskCreate, PendingTaskRead, PendingTaskUpdate
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.schemas.stock_movement import StockMovementCreate, StockMovementRead
from app.schemas.budget import BudgetCreate, BudgetRead, BudgetItemCreate, BudgetItemRead
from app.schemas.payment import PaymentCreate, PaymentRead
from app.schemas.team import TeamMemberRead
from app.schemas.cost import CostCreate, CostRead, CostUpdate
from app.schemas.plan import PlanUsage, CompanyAdmin
