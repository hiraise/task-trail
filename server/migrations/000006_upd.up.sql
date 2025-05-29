ALTER TABLE email_tokens
    ALTER COLUMN purpose TYPE VARCHAR;

UPDATE email_tokens
SET purpose = 'verify'
WHERE purpose = 'confirm';

ALTER TABLE email_tokens
    ADD CONSTRAINT email_token_purpose_check
    CHECK (purpose IN ('verify', 'reset'));

DROP TYPE IF EXISTS email_token_purpose;
