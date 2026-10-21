-- Администратор сервиса (ADR-0014): первый аккаунт получает признак при регистрации.
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- rotated_at — когда токен обменяли на новую пару: ещё 30 секунд он годится для параллельного
-- запроса из другой вкладки, позже его использование — кража (контракт, POST /v1/auth/refresh).
-- revoked_at — сессию закрыли: выход или отзыв всех токенов пользователя.
ALTER TABLE refresh_tokens ADD COLUMN rotated_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE refresh_tokens ALTER COLUMN expired_at SET NOT NULL;
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expired_at ON refresh_tokens(expired_at);

-- Токены подтверждения почты и сброса пароля старого API. Подтверждения почты больше нет
-- (ADR-0016), токены ссылок сброса и приглашений хранятся хешами — своими таблицами.
DROP TABLE confirmation_tokens;
