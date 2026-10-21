-- Настройки сервиса, которые администратор меняет в интерфейсе (ADR-0015).
-- value — настройка без секретов; secret — её секрет, зашифрованный ключом из APP_SECRET.
CREATE TABLE settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    secret BYTEA NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
