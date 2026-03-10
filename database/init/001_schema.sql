-- ============================================================
-- Solar ERP — Database Initialization Script
-- Multi-Tenant Edition
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'partner', 'technician');
CREATE TYPE subscription_plan AS ENUM ('demo', 'pro');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');
CREATE TYPE installation_status AS ENUM ('pending', 'in_progress', 'completed', 'maintenance', 'inactive');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE stock_movement_type AS ENUM ('incoming', 'outgoing');
CREATE TYPE budget_status AS ENUM ('draft', 'sent', 'approved', 'rejected');
CREATE TYPE problem_status AS ENUM ('open', 'resolved', 'ignored');

-- ============================================================
-- COMPANIES (Tenants)
-- ============================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan subscription_plan NOT NULL DEFAULT 'demo',
    subscription_status subscription_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT true,
    phone VARCHAR(50),
    avatar_url TEXT,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_company ON users(company_id);

-- ============================================================
-- CLIENTS
-- ============================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    tax_id VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_company ON clients(company_id);

-- ============================================================
-- INSTALLATIONS
-- ============================================================

CREATE TABLE installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    province VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    panel_count INTEGER NOT NULL DEFAULT 0,
    panel_model VARCHAR(255),
    inverter_model VARCHAR(255),
    inverter_count INTEGER NOT NULL DEFAULT 1,
    system_power_kw DECIMAL(10, 2),
    installation_date DATE,
    status installation_status NOT NULL DEFAULT 'pending',
    description TEXT,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_installations_company ON installations(company_id);
CREATE INDEX idx_installations_client ON installations(client_id);
CREATE INDEX idx_installations_status ON installations(status);
CREATE INDEX idx_installations_date ON installations(installation_date);

-- ============================================================
-- ACTIVITIES
-- ============================================================

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_activities_installation ON activities(installation_id);

-- ============================================================
-- PHOTOS
-- ============================================================

CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    s3_key TEXT NOT NULL,
    s3_bucket VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) DEFAULT 'image/jpeg',
    file_size_bytes BIGINT,
    caption TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_company ON photos(company_id);
CREATE INDEX idx_photos_installation ON photos(installation_id);

-- ============================================================
-- PENDING TASKS
-- ============================================================

CREATE TABLE pending_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_id UUID REFERENCES installations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'pending',
    assigned_to UUID REFERENCES users(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_company ON pending_tasks(company_id);
CREATE INDEX idx_tasks_installation ON pending_tasks(installation_id);
CREATE INDEX idx_tasks_status ON pending_tasks(status);
CREATE INDEX idx_tasks_assigned ON pending_tasks(assigned_to);

-- ============================================================
-- BUDGETS
-- ============================================================

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
    budget_number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status budget_status NOT NULL DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, budget_number)
);

CREATE INDEX idx_budgets_company ON budgets(company_id);
CREATE INDEX idx_budgets_installation ON budgets(installation_id);

-- ============================================================
-- BUDGET ITEMS
-- ============================================================

CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100),
    reference VARCHAR(255),
    status payment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_installation ON payments(installation_id);

-- ============================================================
-- MAINTENANCE
-- ============================================================

CREATE TABLE maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    status maintenance_status NOT NULL DEFAULT 'scheduled',
    maintenance_type VARCHAR(100) NOT NULL DEFAULT 'routine',
    description TEXT,
    findings TEXT,
    assigned_to UUID REFERENCES users(id),
    notification_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_maintenance_company ON maintenance(company_id);
CREATE INDEX idx_maintenance_installation ON maintenance(installation_id);
CREATE INDEX idx_maintenance_date ON maintenance(scheduled_date);
CREATE INDEX idx_maintenance_status ON maintenance(status);

-- ============================================================
-- PRODUCTS (Inventory)
-- ============================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, sku)
);

CREATE INDEX idx_products_company ON products(company_id);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    installation_id UUID REFERENCES installations(id),
    movement_type stock_movement_type NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX idx_stock_product ON stock_movements(product_id);
CREATE INDEX idx_stock_installation ON stock_movements(installation_id);

-- ============================================================
-- KNOWLEDGE BASE (Problems & Solutions)
-- ============================================================

CREATE TABLE problem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status problem_status NOT NULL DEFAULT 'open',
    tags VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_problem_company ON problem(company_id);

CREATE TABLE solution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problem(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solution_problem ON solution(problem_id);


-- ============================================================
-- SEED DATA 
-- ============================================================
-- Master company
INSERT INTO companies (id, name, plan) VALUES
('11111111-1111-1111-1111-111111111111', 'Proyecto Solar', 'pro');
