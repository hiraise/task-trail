CREATE TABLE task_statuses (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(254) NOT NULL,
    project_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE UNIQUE INDEX only_one_status_is_default_for_project_uix
ON task_statuses (project_id, is_default)
WHERE is_default = true;

ALTER TABLE tasks 
ALTER COLUMN author_id SET NOT NULL,
ALTER COLUMN project_id SET NOT NULL,
ADD status_id INTEGER NOT NULL,
ADD assignee_id INTEGER,
ADD FOREIGN KEY (status_id) REFERENCES task_statuses(id),
ADD FOREIGN KEY (assignee_id) REFERENCES users(id);


INSERT INTO task_statuses (project_id, name, is_default, is_resolved)
SELECT id, status_name, def, res
FROM projects,
LATERAL (VALUES
    ('Open', true, false),
    ('In progress', false, false),
    ('To verify', false, false),
    ('Done', false, true)
) AS statuses(status_name, def, res);

UPDATE task_statuses AS ts
SET deleted_at = NOW()
FROM projects AS p
WHERE p.id = ts.project_id
  AND p.deleted_at IS NOT NULL;