import type { ProjectId, UserId } from "@/domain/types";

export interface CreateProjectPayload {
  name: string;
  description?: string;
  participants?: string[]; //emails
}

export interface EditProjectPayload {
  /**
   * Project ID is used for routing (endpoint URL),
   * NOT included in request body
   */
  projectId: ProjectId;
  name?: string;
  description?: string;
}

export interface AddMembersPayload {
  projectId: ProjectId;
  emails: string[];
}

export interface RemoveMemberPayload {
  projectId: ProjectId;
  memberId: UserId;
}

export interface LeaveProjectPayload {
  projectId: ProjectId;
}
