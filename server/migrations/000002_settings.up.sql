-- Service settings the administrator changes in the UI (ADR-0015).
-- value — a setting without secrets; secret — its secret, encrypted with a key from APP_SECRET.
CREATE TABLE settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    secret BYTEA NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
