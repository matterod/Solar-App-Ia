-- ============================================================
-- Solar ERP — Budget Evolution Migration
-- Adds: sale_price to products, client_id to budgets,
--        product_id to budget_items, makes installation_id nullable
-- ============================================================

-- 1. Add sale_price to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price DECIMAL(12, 2);

-- 2. Add client_id to budgets (direct client reference)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 3. Make installation_id nullable on budgets
ALTER TABLE budgets ALTER COLUMN installation_id DROP NOT NULL;

-- 4. Add product_id to budget_items (link to inventory)
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 5. Add indexes
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at);
CREATE INDEX IF NOT EXISTS idx_budget_items_product_id ON budget_items(product_id);
