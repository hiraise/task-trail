-- Project keys and task numbers (ADR-0026): the task key is <project key>-<number>.
-- task_counter hands out task numbers; a number is never reused, a deleted task keeps its own.
ALTER TABLE projects ADD COLUMN key VARCHAR(10);
ALTER TABLE projects ADD COLUMN task_counter INT NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN number INT;

-- Existing projects get keys P1, P2… and their tasks numbers 1, 2… by creation date,
-- deleted rows included.
UPDATE projects p SET key = k.key
FROM (SELECT id, 'P' || row_number() OVER (ORDER BY created_at, id) AS key FROM projects) k
WHERE p.id = k.id;

UPDATE tasks t SET number = n.number
FROM (SELECT id, row_number() OVER (PARTITION BY project_id ORDER BY created_at, id) AS number FROM tasks) n
WHERE t.id = n.id;

UPDATE projects p SET task_counter = COALESCE((SELECT MAX(number) FROM tasks WHERE project_id = p.id), 0);

ALTER TABLE projects ALTER COLUMN key SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN number SET NOT NULL;

-- The key of a deleted project is free again (ADR-0001).
CREATE UNIQUE INDEX uq_projects_key ON projects(key) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_tasks_project_number ON tasks(project_id, number);
