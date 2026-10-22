-- Task lists (GET /v1/projects/{projectId}/tasks, GET /v1/users/me/tasks) and unassigning
-- on leaving a project look only for non-deleted tasks (ADR-0001).
CREATE INDEX idx_tasks_project_id ON tasks(project_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id) WHERE deleted_at IS NULL;
