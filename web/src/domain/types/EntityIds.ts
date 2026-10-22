export type BoardId = string;

export type CommentId = string;

export type ProjectId = string;

export type TaskId = string;

/**
 * Статус задачи (ADR-0003): набор фиксирован и одинаков во всех проектах. По ID статусы
 * сравнивают, название для показа приходит с сервера (`GET /v1/task-statuses`).
 */
export type TaskStatusId = "open" | "in_progress" | "in_review" | "done";

export type UserId = string;
