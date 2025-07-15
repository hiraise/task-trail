import { Project } from "@/domain/project/project.entity";
import { ApiProject } from "../api/types";

export function mapProjectFromApi(data: ApiProject): Project {
  return {
    id: String(data.id),
    name: data.name,
    description: data.description,
    totalTasks: data.totalTasks || 0,
  };
}
