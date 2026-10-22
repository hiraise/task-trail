CREATE TABLE confirmation_tokens
(
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    purpose VARCHAR NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX idx_confirmation_tokens_id_user ON confirmation_tokens(id, user_id);

DROP INDEX idx_refresh_tokens_expired_at;
DROP INDEX idx_refresh_tokens_user_id;
ALTER TABLE refresh_tokens ALTER COLUMN expired_at DROP NOT NULL;
ALTER TABLE refresh_tokens DROP COLUMN rotated_at;

ALTER TABLE users DROP COLUMN is_admin;
