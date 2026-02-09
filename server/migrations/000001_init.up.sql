CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    username VARCHAR(100) NULL,
    avatar_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT non_empty_email CHECK (char_length(email) > 0),
    CONSTRAINT non_empty_pwd CHECK (char_length(password_hash) > 0)
);

CREATE TABLE files (   
    id UUID PRIMARY KEY,
    original_name VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soft_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT fk_user FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX idx_files_id_user ON files(id, owner_id);

ALTER TABLE users ADD CONSTRAINT fk_avatar 
    FOREIGN KEY (avatar_id) REFERENCES files(id);


CREATE TABLE refresh_tokens(
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
    
      
);
CREATE INDEX idx_refresh_tokens_id_user ON refresh_tokens(id, user_id);

CREATE TABLE email_tokens
(   
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    purpose VARCHAR NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX idx_email_tokens_id_user ON email_tokens(id, user_id);

CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR (254) NOT NULL,
    description VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE project_members (
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    role VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    name VARCHAR(254) NOT NULL,
    description VARCHAR,
    status VARCHAR NOT NULL,
    author_id UUID NOT NULL,
    project_id UUID NOT NULL,
    assignee_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_author FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT fk_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)
);