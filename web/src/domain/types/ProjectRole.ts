/** Роль в проекте (ADR-0003): набор фиксирован, права в интерфейсе — по роли (shared/utils/userRole.ts). */
export type ProjectRole = "owner" | "admin" | "member";

/** Роль, которую владелец может назначить участнику: роль владельца не передаётся. */
export type AssignableRole = Exclude<ProjectRole, "owner">;
