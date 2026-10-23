-- Optional due date of a task: a calendar day without time (ADR-0034).
ALTER TABLE tasks ADD COLUMN due_date DATE;
