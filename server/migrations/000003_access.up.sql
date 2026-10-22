-- Service administrator (ADR-0014): the first account gets the flag at registration.
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- rotated_at — when the token was exchanged for a new pair: for 30 more seconds it is accepted for a parallel
-- request from another tab, later use of it is theft (contract, POST /v1/auth/refresh).
-- revoked_at — the session was closed: sign-out or revocation of all the user's tokens.
ALTER TABLE refresh_tokens ADD COLUMN rotated_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE refresh_tokens ALTER COLUMN expired_at SET NOT NULL;
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expired_at ON refresh_tokens(expired_at);

-- Email confirmation and password reset tokens of the old API. There is no email confirmation anymore
-- (ADR-0016), reset link and invitation tokens are stored as hashes — in their own tables.
DROP TABLE confirmation_tokens;
