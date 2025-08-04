INSERT INTO permissions (name, description)
VALUES
('PROJECT_GET_CANDIDATES', 'Get members from porject as candidates to other projects');


INSERT INTO project_role_permission (role_id, permission_id)
SELECT PR.id, P.id
FROM project_roles as PR
JOIN permissions as P ON
	(
		(PR.name = 'owner') AND P.name = 'PROJECT_GET_CANDIDATES'
	)
ON CONFLICT DO NOTHING;