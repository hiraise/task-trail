INSERT INTO permissions (name, description)
VALUES
('PROJECT_OWNER', 'Indicate absolute project rights');


INSERT INTO project_role_permission (role_id, permission_id)
SELECT PR.id, P.id
FROM project_roles as PR
JOIN permissions as P ON
	(
		(PR.name = 'owner') AND P.name = 'PROJECT_OWNER'
	)
ON CONFLICT DO NOTHING;