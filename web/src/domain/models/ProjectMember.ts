import type { ProjectRole } from "../types";

import type { User } from "./User";

/** Участник проекта: пользователь и его роль в проекте. */
export interface ProjectMember extends User {
  role: ProjectRole;
}
