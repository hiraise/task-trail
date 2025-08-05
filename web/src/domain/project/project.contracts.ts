import { User } from "../user/user.entity";
import { Project } from "./project.entity";
import { EditProjectPayload, ProjectPayload } from "./project.payload";

export type GetProjects = () => Promise<Project[]>;
export type NewProject = (payload: ProjectPayload) => Promise<Project>;
export type GetProjectById = (id: number) => Promise<Project | null>;
export type AddMembers = (emails: string[], id?: number) => Promise<void>;
export type GetProjectCandidates = (id?: number) => Promise<User[]>;
export type EditProject = (
  id: number,
  payload: EditProjectPayload
) => Promise<void>;

export type ProjectService = {
  getProjects: GetProjects;
  newProject: NewProject;
  getProjectById: GetProjectById;
  addMembers: AddMembers;
  getProjectCandidates: GetProjectCandidates;
  editProject: EditProject;
};
