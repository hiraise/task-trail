import { Task, TaskStatus } from "../task/task.entity";
import { User } from "../user/user.entity";
import { Project, ProjectMember } from "./project.entity";
import { EditProjectPayload, ProjectPayload } from "./project.payload";

export type ProjectService = {
  get: () => Promise<Project[]>;
  create: (payload: ProjectPayload) => Promise<Project>;
  getById: (id: number) => Promise<Project | null>;
  addMembers: (emails: string[], id?: number) => Promise<void>;
  getMembers: (id: number) => Promise<ProjectMember[]>;
  getCandidates: (id?: number) => Promise<User[]>;
  edit: (id: number, payload: EditProjectPayload) => Promise<void>;
  delete: (id: number) => Promise<void>;
  kickMember: (projectId: number, memberId: number) => Promise<void>;
  leave: (id: number) => Promise<void>;
  getTasks: (id: number) => Promise<Task[]>;
  getStatuses: (id: number) => Promise<TaskStatus[]>;
};
