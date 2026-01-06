import type { ProjectMember } from "../models/ProjectMember";
import type { ProjectId } from "../valueobjects/ProjectId";
import type { ProjectMemberId } from "../valueobjects/ProjectMemberId";

export interface ProjectMemberRepository {
  findById(id: ProjectMemberId): Promise<ProjectMember | null>;
  findByProjectId(projectId: ProjectId): Promise<ProjectMember[]>;
  addByEmails(projectId: ProjectId, emails: string[]): Promise<void>;
  removeMember(projectId: ProjectId, memberId: ProjectMemberId): Promise<void>;
  leaveProject(projectId: ProjectId): Promise<void>;
}
