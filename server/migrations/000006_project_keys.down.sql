DROP INDEX uq_tasks_project_number;
DROP INDEX uq_projects_key;
ALTER TABLE tasks DROP COLUMN number;
ALTER TABLE projects DROP COLUMN task_counter;
ALTER TABLE projects DROP COLUMN key;
