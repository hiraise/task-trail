CREATE TABLE project_users (
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
    
);

INSERT INTO project_users (user_id, project_id)
SELECT user_id, project_id
FROM project_role_user
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS project_role_user, project_role_permission, project_roles, permissions;
