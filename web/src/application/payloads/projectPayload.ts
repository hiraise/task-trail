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
