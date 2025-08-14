import { PermissionType, Project } from "@/domain/project/project.entity";
import { formatDate } from "@/shared/utils/formatters";

export interface ApiProject {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  tasksCount: number;
  permissions: PermissionType[];
}

export const mapProjectFromApi = (apiProject: ApiProject): Project => {
  return {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description,
    createdAt: formatDate(apiProject.createdAt),
    totalTasks: apiProject.tasksCount,
    permissions: apiProject.permissions,
  };
};
