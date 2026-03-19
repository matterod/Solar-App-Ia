-- ============================================================
-- Solar ERP — Telegram Bot Integration
-- Tables: telegram_links, telegram_messages, telegram_link_codes
-- ============================================================

-- 1. telegram_links — maps a Telegram chat to a Solar ERP user
CREATE TABLE IF NOT EXISTS telegram_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    telegram_chat_id BIGINT NOT NULL UNIQUE,
    telegram_username VARCHAR(255),
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_links_chat_id ON telegram_links(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_links_user ON telegram_links(user_id);

-- 2. telegram_messages — stores conversation history per chat
CREATE TABLE IF NOT EXISTS telegram_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_chat_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat ON telegram_messages(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created ON telegram_messages(created_at);

-- 3. telegram_link_codes — temporary one-time codes for linking
CREATE TABLE IF NOT EXISTS telegram_link_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(8) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_code ON telegram_link_codes(code);
