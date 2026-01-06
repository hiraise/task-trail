export interface EditTaskCommand {
  taskId: string | number;
  title: string;
  description?: string;
}
