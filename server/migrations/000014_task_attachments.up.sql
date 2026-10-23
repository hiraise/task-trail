-- Attachments of tasks (ADR-0037): a file linked to a task; the uploader is files.owner_id.
ALTER TABLE files ADD COLUMN size BIGINT NOT NULL DEFAULT 0;
CREATE TABLE task_attachments (
    file_id UUID PRIMARY KEY REFERENCES files(id),
    task_id UUID NOT NULL REFERENCES tasks(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id, created_at DESC);
