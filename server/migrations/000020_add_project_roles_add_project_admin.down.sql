DELETE 
FROM project_role_permission
WHERE permission_id IN (
    SELECT id 
    FROM permissions
    WHERE name = 'PROJECT_ADMIN'
);

DELETE 
FROM permissions
WHERE name = 'PROJECT_ADMIN'