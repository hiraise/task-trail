-- A subtask is a task with a parent in the same project, one level deep (ADR-0036).
ALTER TABLE tasks ADD COLUMN parent_id UUID REFERENCES tasks(id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id) WHERE deleted_at IS NULL;
