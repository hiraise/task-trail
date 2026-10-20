import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { Task } from "@/domain/models/Task";
import type { User } from "@/domain/models/User";

export interface ProjectDetailResponseDto {
  project: ProjectDetails;
  members: ProjectMember[];
  owner: User;
  tasks: Task[];
}
