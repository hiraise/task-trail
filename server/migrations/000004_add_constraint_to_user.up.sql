ALTER TABLE users
ADD CONSTRAINT non_empty_email CHECK (char_length(email) > 0),
ADD CONSTRAINT non_empty_pwd CHECK (char_length(password_hash) > 0);