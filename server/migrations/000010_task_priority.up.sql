-- Task priority (ADR-0033): a fixed set, existing tasks get normal.
ALTER TABLE tasks ADD COLUMN priority VARCHAR NOT NULL DEFAULT 'normal';
