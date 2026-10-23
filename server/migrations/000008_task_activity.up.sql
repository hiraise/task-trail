-- Task feed: comments and change history (ADR-0028). seq only orders rows written at the same time;
-- the API does not return it.
CREATE TABLE task_comments (
    id UUID PRIMARY KEY,
    seq BIGINT GENERATED ALWAYS AS IDENTITY,
    task_id UUID NOT NULL REFERENCES tasks(id),
    author_id UUID NOT NULL REFERENCES users(id),
    text VARCHAR(10000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id, created_at DESC, seq DESC);

-- History rows are never edited or deleted. data holds only the change fields the kind sets.
CREATE TABLE task_events (
    id UUID PRIMARY KEY,
    seq BIGINT GENERATED ALWAYS AS IDENTITY,
    task_id UUID NOT NULL REFERENCES tasks(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    kind VARCHAR NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_task_events_task_id ON task_events(task_id, created_at DESC, seq DESC);

-- Existing tasks get their "created" event: the actor is the author, the time is the creation time.
INSERT INTO task_events (id, task_id, actor_id, kind, data, created_at)
SELECT gen_random_uuid(), id, author_id, 'created', '{}', created_at FROM tasks ORDER BY created_at, id;
