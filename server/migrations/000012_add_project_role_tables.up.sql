CREATE TABLE permissions (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(254) NOT NULL UNIQUE,
    description VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_name
ON permissions (name);

INSERT INTO permissions (name, description)
VALUES
('PROJECT_INVITE_USERS', 'Invite users to the project'),
('PROJECT_KICK_USERS', 'Remove users from the project'),
('PROJECT_SET_ROLES', 'Set roles for users in the project'),
('PROJECT_EDIT', 'Edit project details'),
('PROJECT_ARCHIVE', 'Archive the project'),
('PROJECT_DELETE', 'Delete the project');

CREATE TABLE project_roles (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    project_id INTEGER NOT NULL,
    name VARCHAR(254) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- create roles for each project

INSERT INTO project_roles (project_id, name)
SELECT id, role_name
FROM projects,
LATERAL (VALUES
    ('member'),
    ('owner'),
    ('admin')
) AS roles(role_name);

CREATE TABLE project_role_permission (
    permission_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (permission_id, role_id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id),
    FOREIGN KEY (role_id) REFERENCES project_roles(id)
);


-- link permissions and roles

INSERT INTO project_role_permission (role_id, permission_id)
SELECT PR.id, P.id
FROM project_roles as PR
JOIN permissions as P ON
	(
		(PR.name = 'owner') OR
		(PR.name = 'admin') AND P.name NOT IN ('PROJECT_SET_ROLES', 'PROJECT_ARCHIVE', 'PROJECT_DELETE')
	)
ON CONFLICT DO NOTHING;

CREATE TABLE project_role_user (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, user_id, role_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES project_roles(id)
);

-- link project members and roles

INSERT INTO project_role_user (project_id, user_id, role_id)
SELECT U.project_id, U.user_id, R.id
FROM project_roles AS R
JOIN project_users AS U ON U.project_id = R.project_id
WHERE
    (R.name = 'member' AND U.user_id <> (SELECT owner_id FROM projects WHERE id = U.project_id))
    OR
    (R.name = 'owner' AND U.user_id = (SELECT owner_id FROM projects WHERE id = U.project_id));


-- drop old table

DROP TABLE IF EXISTS project_users;
