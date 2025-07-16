CREATE TABLE files (   
    id UUID PRIMARY KEY,
    original_name VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    owner_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT fk_user
      FOREIGN KEY(owner_id)
        REFERENCES users(id)
);
CREATE INDEX idx_files_id_user ON files(id, owner_id);