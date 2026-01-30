import type { User } from "../models/User";
import type { ProjectId, UserId } from "../types";

export interface UserRepository {
  findById(id: UserId): Promise<User>;
  findCandidatesForProject(projectId?: ProjectId): Promise<User[]>;
  getCurrentUser(): Promise<User | null>;
  updateUser(username?: string, email?: string): Promise<User>;
  uploadAvatar(data: FormData): Promise<string | null>;
}
