ALTER TABLE projects
ADD owner_id INTEGER NOT NULL,
CONSTRAINT fk_owner
    FOREIGN KEY (owner_id)
    REFERENCES users(id)