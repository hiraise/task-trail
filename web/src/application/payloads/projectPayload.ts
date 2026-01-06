export interface CreateProjectPayload {
  name: string;
  description?: string;
  participants?: string[]; //emails
}

export interface EditProjectPayload {
  projectId: string | number;
  name?: string;
  description?: string;
}

export interface AddMembersPayload {
  projectId: string | number;
  emails: string[];
}

export interface RemoveMemberPayload {
  projectId: string | number;
  memberId: string | number;
}

export interface LeaveProjectPayload {
  projectId: string | number;
}
