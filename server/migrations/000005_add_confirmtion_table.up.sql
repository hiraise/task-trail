CREATE TYPE email_token_purpose AS ENUM ('confirm', 'reset');
CREATE TABLE email_tokens
(   
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    purpose email_token_purpose NOT NULL,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id)
        REFERENCES users(id)
);
CREATE INDEX idx_email_tokens_id_user ON email_tokens(id, user_id);