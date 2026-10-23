-- A task can be archived and restored (ADR-0027); projects have had archived_at since 000001.
ALTER TABLE tasks ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
