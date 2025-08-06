CREATE UNIQUE INDEX unique_project_role_name_not_deleted
ON project_roles (project_id, name)
WHERE deleted_at IS NULL;