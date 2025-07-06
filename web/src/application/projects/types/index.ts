export interface ProjectParticipant {
  id?: string;
  username?: string;
  email: string;
  avatarUrl?: string;
}

export interface CreateProjectFormData {
  name: string;
  description: string;
  participants: string[];
}
