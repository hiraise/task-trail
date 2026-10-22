import type { ProjectChanges } from "@/domain/repositories/ProjectRepository";
import type { AssignableRole, ProjectId, UserId } from "@/domain/types";

export interface CreateProjectPayload {
  name: string;
  description?: string;
  /** Кого позвать сразу (ADR-0016) */
  emails: string[];
}

export interface EditProjectPayload extends ProjectChanges {
  projectId: ProjectId;
}

export interface AddMembersPayload {
  projectId: ProjectId;
  emails: string[];
}

export interface RemoveMemberPayload {
  projectId: ProjectId;
  memberId: UserId;
}

export interface ChangeMemberRolePayload {
  projectId: ProjectId;
  memberId: UserId;
  role: AssignableRole;
}

export interface LeaveProjectPayload {
  projectId: ProjectId;
}
