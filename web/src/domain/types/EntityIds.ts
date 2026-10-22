export type BoardId = string;

export type CommentId = string;

export type ProjectId = string;

export type TaskId = string;

/**
 * Task status (ADR-0003): the set is fixed and the same in all projects. Statuses are compared
 * by ID; the display name comes from the server (`GET /v1/task-statuses`).
 */
export type TaskStatusId = "open" | "in_progress" | "in_review" | "done";

export type UserId = string;
