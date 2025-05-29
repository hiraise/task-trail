CREATE TYPE email_token_purpose AS ENUM ('confirm', 'reset');

ALTER TABLE email_tokens DROP CONSTRAINT IF EXISTS email_token_purpose_check;

UPDATE email_tokens
SET purpose = 'confirm'
WHERE purpose = 'verify';

ALTER TABLE email_tokens
    ALTER COLUMN purpose TYPE email_token_purpose
    USING purpose::email_token_purpose;
