import type { ProjectResponseDto } from "./ProjectResponseDto";
import type { TaskResponseDto } from "./TaskResponseDto";
import type { TaskStatusResponseDto } from "./TaskStatusResponseDto";
import type { UserResponseDto } from "./UserResponseDto";

export interface TaskDetailResponseDto {
  task: TaskResponseDto;
  project: ProjectResponseDto;
  assignee: UserResponseDto;
  status: TaskStatusResponseDto;
}
