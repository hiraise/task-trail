CREATE TABLE refresh_tokens(
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id)
        REFERENCES users(id)
    
      
);
CREATE INDEX idx_refresh_tokens_id_user ON refresh_tokens(id, user_id);