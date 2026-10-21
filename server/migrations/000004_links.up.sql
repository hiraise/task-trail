-- Ссылки сброса пароля и приглашения (ADR-0016): токен из ссылки получает только человек,
-- в базе — его хеш SHA-256. Ссылка сброса срабатывает один раз: сброс удаляет все ссылки
-- пользователя. Истёкшие строки удаляет периодическая очистка.
CREATE TABLE password_resets (
    token_hash BYTEA PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_expired_at ON password_resets(expired_at);

-- Приглашение почты без аккаунта в проект. Новое приглашение той же почты в тот же проект
-- заменяет прежнее — отсюда уникальность (project_id, email). Принятое приглашение остаётся
-- до конца срока: его ссылка ведёт на вход.
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
