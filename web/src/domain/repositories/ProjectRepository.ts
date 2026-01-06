import type { Project } from "../models/Project";
import type { ProjectId } from "../valueobjects/ProjectId";
import type { TaskStatus } from "../valueobjects/TaskStatus";

export interface ProjectRepository {
  findById: (id: ProjectId) => Promise<Project>;
  findAll: () => Promise<Project[]>;
  create: (data: {
    name: string;
    description?: string;
    participants?: string[];
  }) => Promise<ProjectId>;
  update(project: Project): Promise<Project>;
  delete(id: ProjectId): Promise<void>;
  getProjectStatuses(projectId: ProjectId): Promise<TaskStatus[]>;
}
