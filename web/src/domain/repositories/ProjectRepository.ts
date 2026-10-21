import type { Project, ProjectDetails } from "../models/Project";
import type { TaskStatus } from "../models/TaskStatus";
import type { ProjectId } from "../types";

export interface ProjectRepository {
  findById: (id: ProjectId) => Promise<ProjectDetails>;
  findAll: () => Promise<Project[]>;
  create: (data: {
    name: string;
    description?: string;
    participants?: string[];
  }) => Promise<ProjectId>;
  update(data: {
    projectId: ProjectId;
    name: string;
    description?: string;
  }): Promise<ProjectDetails>;
  delete(id: ProjectId): Promise<void>;
  getProjectStatuses(projectId: ProjectId): Promise<TaskStatus[]>;
}
