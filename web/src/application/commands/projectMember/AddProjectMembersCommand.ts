export interface AddProjectMembersCommand {
  projectId: string | number;
  emails: string[];
}
