export interface ProjectMemberDTO {
  id: number;
  email: string;
  username: string;
  permissions: string[];
}

export interface AddMembersPayload {
  emails: string[];
}
