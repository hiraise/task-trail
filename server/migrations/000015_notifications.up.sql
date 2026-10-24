-- Notifications of users about tasks (ADR-0038). seq only orders rows written at the same time.
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    seq BIGINT GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES users(id),
    task_id UUID NOT NULL REFERENCES tasks(id),
    actor_id UUID REFERENCES users(id),
    kind VARCHAR NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    emailed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC, seq DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
-- The email job (step 13) looks for unread, not emailed rows.
CREATE INDEX idx_notifications_email ON notifications(created_at) WHERE emailed_at IS NULL AND read_at IS NULL;
-- A due date reminder comes at most once per user, task, kind and date (step 13).
CREATE UNIQUE INDEX uq_notifications_reminder ON notifications(user_id, task_id, kind, (data->>'dueDate'))
    WHERE kind IN ('due_soon', 'overdue');

-- Notification emails, on by default; they go only while mail is connected (ADR-0017).
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT TRUE;
