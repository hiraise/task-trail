INSERT INTO permissions (name, description)
VALUES
('PROJECT_ADMIN', 'Indicate admin project rights');


INSERT INTO project_role_permission (role_id, permission_id)
SELECT PR.id, P.id
FROM project_roles as PR
JOIN permissions as P ON
	(
		(PR.name = 'admin') AND P.name = 'PROJECT_ADMIN'
	)
ON CONFLICT DO NOTHING;