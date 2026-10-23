import type { InvitationResult } from "../models/Invitation";
import type { Project, ProjectDetails } from "../models/Project";
import type { ProjectId } from "../types";

export interface NewProject {
  name: string;
  description?: string;
  /** Project key, like DS (ADR-0026) */
  key: string;
  /** Who to invite right away (ADR-0016) */
  emails: string[];
}

export interface ProjectChanges {
  name?: string;
  /** null removes the description */
  description?: string | null;
  /** Only the owner changes the key; the keys of the project tasks change with it */
  key?: string;
}

/** The created project and a result for each invited email. */
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
}
