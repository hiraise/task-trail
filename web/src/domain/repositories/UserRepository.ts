import type { CurrentUser, User } from "../models/User";
import type { ProjectId, UserId } from "../types";

export interface UserRepository {
  findById(id: UserId): Promise<User>;
  findCandidatesForProject(projectId?: ProjectId): Promise<User[]>;
  getCurrentUser(): Promise<CurrentUser>;
  /** `null` — убрать имя */
  updateCurrentUser(username: string | null): Promise<CurrentUser>;
  uploadAvatar(file: File): Promise<CurrentUser>;
}
