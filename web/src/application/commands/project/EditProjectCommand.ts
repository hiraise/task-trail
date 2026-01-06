export interface EditProjectCommand {
  projectId: string | number;
  name?: string;
  description?: string;
}
