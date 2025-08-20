import { EditProjectPayload } from "@/domain/project/project.payload";

export const TAG_TYPES = {
  PROJECT: "Project",
  PROJECTS: "Projects",
  MEMBER: "Member",
  CANDIDATE: "Candidate",
  TASKS: "Tasks",
} as const;

export interface KickMemberArgs {
  projectId: number;
  memberId: number;
}

export interface LeaveProjectArgs {
  projectId: number;
}

export interface EditProjectArgs {
  id: number;
  payload: EditProjectPayload;
}

export interface AddMembersArgs {
  emails: string[];
  id?: number;
}

export interface CreateProjectArgs {
  name: string;
  description?: string;
  participants?: string[];
}

export interface GetTasksArgs {
  projectId: number;
}
