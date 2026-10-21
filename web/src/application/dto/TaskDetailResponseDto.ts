import type { Project } from "@/domain/models/Project";
import type { Task } from "@/domain/models/Task";
import type { TaskStatus } from "@/domain/models/TaskStatus";
import type { User } from "@/domain/models/User";

export interface TaskDetailResponseDto {
  task: Task;
  project: Project;
  assignee: User | null;
  status: TaskStatus;
}
