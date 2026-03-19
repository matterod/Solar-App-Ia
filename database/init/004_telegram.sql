-- ============================================================
-- Solar ERP — Telegram Integration
-- Tables: telegram_links, telegram_messages, telegram_link_codes
-- ============================================================

-- Maps a Telegram chat_id to a Solar ERP user
CREATE TABLE IF NOT EXISTS telegram_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    telegram_chat_id BIGINT NOT NULL UNIQUE,
    telegram_username VARCHAR(255),
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_links_chat_id ON telegram_links(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_links_user ON telegram_links(user_id);

-- Conversation history per Telegram chat
CREATE TABLE IF NOT EXISTS telegram_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_chat_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat ON telegram_messages(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created ON telegram_messages(telegram_chat_id, created_at DESC);

-- One-time codes for account linking
CREATE TABLE IF NOT EXISTS telegram_link_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(8) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_code ON telegram_link_codes(code);
CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_user ON telegram_link_codes(user_id);
