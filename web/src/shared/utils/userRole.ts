import type { ProjectRole } from "../../domain/types";

// Права в интерфейсе — по роли в проекте (ADR-0003), как их проверяет сервер (контракт API,
// описания операций проектов). Интерфейс прячет недоступные действия; запрет всё равно
// решает сервер, и ответ FORBIDDEN показывается текстом из shared/locales/apiErrors.ts.

const isManager = (role: ProjectRole): boolean => role === "owner" || role === "admin";

/** Название, описание и приглашения — владелец и администратор. */
export const canEditProject = isManager;

export const canInviteMembers = isManager;

/** Удалить проект и менять роли может только владелец. */
export const canDeleteProject = (role: ProjectRole): boolean => role === "owner";

export const canChangeRoles = (role: ProjectRole): boolean => role === "owner";

/** Архива на сервере ещё нет (этап 2) — пункт меню остаётся заглушкой для владельца. */
export const canArchiveProject = (role: ProjectRole): boolean => role === "owner";

/** Владелец не выходит из проекта, а удаляет его. */
export const canLeaveProject = (role: ProjectRole): boolean => role !== "owner";

/** Владелец исключает любого, кроме себя; администратор — только участников с ролью «участник». */
export const canRemoveMember = (role: ProjectRole, memberRole: ProjectRole): boolean =>
  (role === "owner" && memberRole !== "owner") || (role === "admin" && memberRole === "member");

/** Владелец и администраторы — в группе «Администраторы проекта». */
export const isProjectAdmin = isManager;
