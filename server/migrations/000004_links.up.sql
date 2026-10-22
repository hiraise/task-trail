-- Password reset links and invitations (ADR-0016): only the person gets the token from the link,
-- the database keeps its SHA-256 hash. A reset link works once: a reset deletes all the user's
-- links. Expired rows are deleted by a periodic cleanup.
CREATE TABLE password_resets (
    token_hash BYTEA PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_expired_at ON password_resets(expired_at);

-- An invitation of an email without an account to a project. A new invitation of the same email to the same project
-- replaces the previous one — hence the uniqueness of (project_id, email). An accepted invitation stays
-- until it expires: its link leads to sign-in.
CREATE TABLE invitations (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    email VARCHAR(254) NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    token_hash BYTEA NOT NULL UNIQUE,
    expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT invitations_project_email UNIQUE (project_id, email)
);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_expired_at ON invitations(expired_at);
