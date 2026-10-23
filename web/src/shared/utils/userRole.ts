import type { ProjectRole } from "../../domain/types";

// UI permissions follow the project role (ADR-0003), as the server checks them (the API contract,
// project operation descriptions). The UI hides unavailable actions; the server still makes
// the final call, and a FORBIDDEN response is shown with the text from shared/locales/apiErrors.ts.

const isManager = (role: ProjectRole): boolean => role === "owner" || role === "admin";

/** Name, description and invitations — the owner and admin. */
export const canEditProject = isManager;

export const canInviteMembers = isManager;

/** Only the owner can delete the project and change roles. */
export const canDeleteProject = (role: ProjectRole): boolean => role === "owner";

/** Only the owner changes the project key: it changes the keys of all its tasks (ADR-0026). */
export const canChangeProjectKey = (role: ProjectRole): boolean => role === "owner";

export const canChangeRoles = (role: ProjectRole): boolean => role === "owner";

/** Only the owner archives and restores the project; any member archives a task (ADR-0027). */
export const canArchiveProject = (role: ProjectRole): boolean => role === "owner";

/** The owner does not leave the project but deletes it. */
export const canLeaveProject = (role: ProjectRole): boolean => role !== "owner";

/** The owner removes anyone but themselves; an admin removes only members with the "member" role. */
export const canRemoveMember = (role: ProjectRole, memberRole: ProjectRole): boolean =>
  (role === "owner" && memberRole !== "owner") || (role === "admin" && memberRole === "member");

/** The owner and admins go into the "Project administrators" group. */
export const isProjectAdmin = isManager;

/** A comment is deleted by its author, the project owner and admins (ADR-0028). */
export const canDeleteComment = (role: ProjectRole, isAuthor: boolean): boolean =>
  isAuthor || isManager(role);
