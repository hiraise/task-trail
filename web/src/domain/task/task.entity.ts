export interface Task {
  id: number;
  title: string;
  description: string;
  status: "Open" | "In progress" | "To verify" | "Done";
  createdAt: Date;
  updatedAt: Date;
  projectId: number;
  assigneeId?: number;
}
