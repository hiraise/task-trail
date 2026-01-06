import type { User } from "../models/User";
import type { ProjectId } from "../valueobjects/ProjectId";
import type { UserId } from "../valueobjects/UserId";

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findCandidatesForProject(projectId?: ProjectId): Promise<User[]>;
  getCurrentUser(): Promise<User | null>;
  updateUser(username?: string, email?: string): Promise<User>;
  uploadAvatar(data: FormData): Promise<string | null>;
}
