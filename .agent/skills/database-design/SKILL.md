---
description: Solar ERP database design conventions and schema patterns
---

# Solar ERP — Database Design Skill

## Database: PostgreSQL

## Conventions

### Table Naming
- All lowercase, plural: `clients`, `installations`, `activities`
- Exceptions: `problem`, `solution` (singular, legacy naming)
- Join tables: `{table1}_{table2}`

### Column Naming
- Snake case: `installation_date`, `system_power_kw`
- Primary keys: always `id UUID`
- Foreign keys: `{referenced_table_singular}_id`
- Timestamps: `created_at`, `updated_at` with `TIMESTAMPTZ`

### Data Types
- IDs: `UUID` with `uuid_generate_v4()`
- Strings: `VARCHAR(n)` with appropriate length
- Long text: `TEXT`
- Money: `DECIMAL(12, 2)`
- Coordinates: `DECIMAL(10, 8)` lat, `DECIMAL(11, 8)` lon
- Enums: PostgreSQL `CREATE TYPE` enums
- Booleans: `BOOLEAN NOT NULL DEFAULT false`

### Indexes
- All foreign keys should have indexes
- Status columns should have indexes
- Date columns used for filtering should have indexes
- Named as `idx_{table}_{column}`

### Relationships Pattern
- `ON DELETE CASCADE` for owned entities (installation → activities)
- `ON DELETE SET NULL` for optional references (task → installation)
- No `ON DELETE CASCADE` for users (prevent data loss)

### Special Columns
- `users.message_count`: Tracks the total number of AI questions asked by a user.
- `users.is_superadmin`: Controls global admin access (can change plans and view global usage).

## Enum Types

```sql
CREATE TYPE user_role AS ENUM ('admin', 'partner', 'installer', 'accountant');
CREATE TYPE installation_status AS ENUM ('pending', 'in_progress', 'completed', 'maintenance', 'inactive');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE stock_movement_type AS ENUM ('incoming', 'outgoing');
CREATE TYPE budget_status AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE subscription_plan AS ENUM ('demo', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE problem_status AS ENUM ('open', 'resolved', 'ignored');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE cost_type AS ENUM ('food', 'materials', 'vehicle', 'lodging', 'other');
```

## Core Relationships

```
clients ──< installations ──< activities
                           ──< photos
                           ──< pending_tasks
                           ──< budgets ──< budget_items
                           ──< payments
                           ──< maintenance
                           ──< stock_movements
                           ──< costs

products ──< stock_movements
```

## Adding New Tables

1. Create SQL in `database/init/` with numbered prefix
2. Create SQLAlchemy model in `backend/app/models/`
3. Ensure `create_type=False` on model Enums (created in SQL)
