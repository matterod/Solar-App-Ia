"""
Solar ERP — SQLAlchemy Models
All database models matching the PostgreSQL schema.
"""

from app.models.user import User
from app.models.client import Client
from app.models.installation import Installation
from app.models.activity import Activity
from app.models.photo import Photo
from app.models.pending_task import PendingTask
from app.models.budget import Budget, BudgetItem
from app.models.payment import Payment
from app.models.maintenance import Maintenance
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.problem import Problem
from app.models.solution import Solution

__all__ = [
    "User",
    "Client",
    "Installation",
    "Activity",
    "Photo",
    "PendingTask",
    "Budget",
    "BudgetItem",
    "Payment",
    "Maintenance",
    "Product",
    "StockMovement",
    "Problem",
    "Solution",
]
