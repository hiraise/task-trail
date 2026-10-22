/** Project role (ADR-0003): the set is fixed; UI permissions depend on the role (shared/utils/userRole.ts). */
export type ProjectRole = "owner" | "admin" | "member";

/** A role the owner can assign to a member: the owner role cannot be transferred. */
export type AssignableRole = Exclude<ProjectRole, "owner">;
