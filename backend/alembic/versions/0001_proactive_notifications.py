"""proactive notifications: extend maintenance and pending_tasks

Revision ID: 0001_proactive_notifications
Revises: None
Create Date: 2026-03-26

Changes:
- maintenance: drop notification_sent, add last_notification_days_before (Integer, nullable)
- pending_tasks: add task_type (Enum), is_recurring (Boolean), last_notification_days_before (Integer)
- data migration: set task_type = 'deadline' for existing pending_task rows
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_proactive_notifications"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create task_type enum type
    task_type_enum = sa.Enum("deadline", "recurring", name="task_type")
    task_type_enum.create(op.get_bind(), checkfirst=True)

    # --- maintenance table ---
    op.drop_column("maintenance", "notification_sent")
    op.add_column(
        "maintenance",
        sa.Column("last_notification_days_before", sa.Integer(), nullable=True),
    )

    # --- pending_tasks table ---
    op.add_column(
        "pending_tasks",
        sa.Column(
            "task_type",
            sa.Enum("deadline", "recurring", name="task_type", create_type=False),
            nullable=True,
        ),
    )
    op.add_column(
        "pending_tasks",
        sa.Column(
            "is_recurring",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.add_column(
        "pending_tasks",
        sa.Column("last_notification_days_before", sa.Integer(), nullable=True),
    )

    # Data migration: default existing rows to 'deadline' task_type
    op.execute("UPDATE pending_tasks SET task_type = 'deadline' WHERE task_type IS NULL")


def downgrade() -> None:
    # --- pending_tasks table ---
    op.drop_column("pending_tasks", "last_notification_days_before")
    op.drop_column("pending_tasks", "is_recurring")
    op.drop_column("pending_tasks", "task_type")

    # --- maintenance table ---
    op.drop_column("maintenance", "last_notification_days_before")
    op.add_column(
        "maintenance",
        sa.Column(
            "notification_sent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Drop enum type
    sa.Enum(name="task_type").drop(op.get_bind(), checkfirst=True)
