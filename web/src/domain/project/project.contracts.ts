import { Project } from "./project.entity";
import { ProjectPayload } from "./project.payload";

export type GetProjects = () => Promise<Project[]>;
export type NewProject = (payload: ProjectPayload) => Promise<Project>;

export type ProjectService = {
  getProjects: GetProjects;
  newProject: NewProject;
};
