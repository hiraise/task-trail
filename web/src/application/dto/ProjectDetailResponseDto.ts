import type { ProjectMemberResponseDto } from "./ProjectMemberResponseDto";
import type { ProjectResponseDto } from "./ProjectResponseDto";
import type { TaskResponseDto } from "./TaskResponseDto";
import type { UserResponseDto } from "./UserResponseDto";

export interface ProjectDetailResponseDto {
  project: ProjectResponseDto;
  members: ProjectMemberResponseDto[];
  owner: UserResponseDto;
  tasks: TaskResponseDto[];
}
