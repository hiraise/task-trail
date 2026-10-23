-- Labels of a project (ADR-0035): any member creates them, the owner and admins manage them.
CREATE TABLE labels (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(30) NOT NULL,
    color VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
-- A name is unique in its project ignoring case.
CREATE UNIQUE INDEX uq_labels_project_name ON labels(project_id, lower(name));

-- Labels of a task, at most 10, all of the task's project. Deleting a label removes its links.
CREATE TABLE task_labels (
    task_id UUID NOT NULL REFERENCES tasks(id),
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);
