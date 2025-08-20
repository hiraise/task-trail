import { Task } from "../task/task.entity";
import { User } from "../user/user.entity";
import { Project, ProjectMember } from "./project.entity";
import { EditProjectPayload, ProjectPayload } from "./project.payload";

export type GetProjects = () => Promise<Project[]>;
export type NewProject = (payload: ProjectPayload) => Promise<Project>;
export type GetProjectById = (id: number) => Promise<Project | null>;
export type AddMembers = (emails: string[], id?: number) => Promise<void>;
export type GetMembers = (id: number) => Promise<ProjectMember[]>;
export type GetProjectCandidates = (id?: number) => Promise<User[]>;
export type DeleteProject = (id: number) => Promise<void>;
export type EditProject = (id: number, payload: EditProjectPayload) => Promise<void>;
export type KickMember = (projectId: number, memberId: number) => Promise<void>;
export type Leave = (id: number) => Promise<void>;
export type GetTasks = (id: number) => Promise<Task[]>;

export type ProjectService = {
  getProjects: GetProjects;
  newProject: NewProject;
  getProjectById: GetProjectById;
  addMembers: AddMembers;
  getMembers: GetMembers;
  getProjectCandidates: GetProjectCandidates;
  editProject: EditProject;
  deleteProject: DeleteProject;
  kickMember: KickMember;
  leave: Leave;
  getTasks: GetTasks;
};
