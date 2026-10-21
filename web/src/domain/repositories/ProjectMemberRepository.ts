import type { ProjectMember } from "../models/ProjectMember";
import type { ProjectId, UserId } from "../types";

export interface ProjectMemberRepository {
  findById(id: UserId): Promise<ProjectMember | null>;
  findByProjectId(projectId: ProjectId): Promise<ProjectMember[]>;
  addByEmails(projectId: ProjectId, emails: string[]): Promise<void>;
  removeMember(projectId: ProjectId, memberId: UserId): Promise<void>;
  leaveProject(projectId: ProjectId): Promise<void>;
}
