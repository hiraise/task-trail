import type { InvitationResult } from "../models/Invitation";
import type { ProjectMember } from "../models/ProjectMember";
import type { AssignableRole, ProjectId, UserId } from "../types";

export interface ProjectMemberRepository {
  findByProjectId(projectId: ProjectId): Promise<ProjectMember[]>;
  /** Invites to the project by email; one result per email, in request order */
  addByEmails(projectId: ProjectId, emails: string[]): Promise<InvitationResult[]>;
  changeRole(projectId: ProjectId, userId: UserId, role: AssignableRole): Promise<ProjectMember>;
  removeMember(projectId: ProjectId, userId: UserId): Promise<void>;
  leaveProject(projectId: ProjectId): Promise<void>;
}
