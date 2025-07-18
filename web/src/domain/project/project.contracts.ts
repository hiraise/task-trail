import { Project } from "./project.entity";
import { ProjectPayload } from "./project.payload";

export type GetProjects = () => Promise<Project[]>;
export type NewProject = (payload: ProjectPayload) => Promise<Project>;
export type GetProjectById = (id: number) => Promise<Project | null>;
export type AddMembers = (
  id: number | undefined,
  emails: string[]
) => Promise<void>;

export type ProjectService = {
  getProjects: GetProjects;
  newProject: NewProject;
  getProjectById: GetProjectById;
  addMembers: AddMembers;
};
