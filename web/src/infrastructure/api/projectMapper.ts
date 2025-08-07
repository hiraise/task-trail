import { PermissionType, Project, RoleType } from "@/domain/project/project.entity";

export interface ProjectRights {
  role: RoleType;
  permissions: PermissionType[];
}

export interface ApiProject {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  tasksCount: number;
  rights: ProjectRights[];
}

export const mapProjectFromApi = (apiProject: ApiProject): Project => {
  return {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description,
    createdAt: apiProject.createdAt.toString(),
    totalTasks: apiProject.tasksCount,
    roles: apiProject.rights ? apiProject.rights.map((right) => right.role) : [],
    permissions: apiProject.rights ? apiProject.rights.flatMap((right) => right.permissions) : [],
  };
};
