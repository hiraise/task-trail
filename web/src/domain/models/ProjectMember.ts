import type { ProjectRole } from "../types";

import type { User } from "./User";

/** Project member: a user and their role in the project. */
export interface ProjectMember extends User {
  role: ProjectRole;
}
