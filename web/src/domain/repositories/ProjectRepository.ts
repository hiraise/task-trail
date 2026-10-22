import type { InvitationResult } from "../models/Invitation";
import type { Project, ProjectDetails } from "../models/Project";
import type { TaskStatus } from "../models/TaskStatus";
import type { ProjectId } from "../types";

export interface NewProject {
  name: string;
  description?: string;
  /** Кого позвать сразу (ADR-0016) */
  emails: string[];
}

export interface ProjectChanges {
  name?: string;
  /** null — убрать описание */
  description?: string | null;
}

/** Созданный проект и результат по каждой приглашённой почте. */
export interface ProjectCreated {
  project: ProjectDetails;
  invitations: InvitationResult[];
}

export interface ProjectRepository {
  findById(id: ProjectId): Promise<ProjectDetails>;
  findAll(): Promise<Project[]>;
  create(project: NewProject): Promise<ProjectCreated>;
  update(id: ProjectId, changes: ProjectChanges): Promise<ProjectDetails>;
  delete(id: ProjectId): Promise<void>;
  getProjectStatuses(projectId: ProjectId): Promise<TaskStatus[]>;
}
