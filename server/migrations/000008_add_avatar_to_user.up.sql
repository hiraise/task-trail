ALTER TABLE users
ADD avatar_id UUID NULL,
ADD username VARCHAR(100) NULL,
ADD CONSTRAINT fk_avatar FOREIGN KEY (avatar_id) REFERENCES files(id);