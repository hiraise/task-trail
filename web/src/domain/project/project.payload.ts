export type ProjectPayload = {
  name: string;
  description?: string;
  participants?: string[];
};

export type AddMembersPayload = {
  emails: string[];
};
