export interface CreateProjectCommand {
  name: string;
  description?: string;
  participants?: string[]; //emails
}
