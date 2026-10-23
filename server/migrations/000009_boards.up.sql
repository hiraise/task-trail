-- Boards (ADR-0029): a view over tasks of several projects. A board is deleted at once, without
-- deleted_at; its projects and members go with it by cascade, tasks stay.
CREATE TABLE boards (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE board_projects (
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id),
    PRIMARY KEY (board_id, project_id)
);

-- The owner is a member too.
CREATE TABLE board_members (
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (board_id, user_id)
);
CREATE INDEX idx_board_members_user_id ON board_members(user_id);
