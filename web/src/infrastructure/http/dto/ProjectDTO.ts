export interface ProjectDTO {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  permissions: string[];
  tasksCount: number;
}

export interface ProjectIdDTO {
  id: number;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  participants?: string[];
}

export interface AddMembersPayload {
  emails: string[];
}

export interface UpdateProjectPayload {
  description?: string;
  name?: string;
}
