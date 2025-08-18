INSERT INTO permissions (name, description)
VALUES
('PROJECT_CREATE_TASK', 'Create new tasks in project'),
('PROJECT_UPDATE_TASK', 'Update tasks in project'),
('PROJECT_DELETE_TASK', 'Delete tasks from project');


INSERT INTO project_role_permission (role_id, permission_id)
SELECT PR.id, P.id
FROM project_roles as PR
JOIN permissions as P ON
	(
		P.name IN  ('PROJECT_CREATE_TASK','PROJECT_UPDATE_TASK','PROJECT_DELETE_TASK')
	)
ON CONFLICT DO NOTHING;