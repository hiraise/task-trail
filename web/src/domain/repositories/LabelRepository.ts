import type { Label, LabelColor } from "../models/Label";
import type { LabelId, ProjectId } from "../types";

export interface LabelData {
  name: string;
  color: LabelColor;
}

// Project labels (ADR-0035): any member reads and creates; the owner and admins change and delete.
export interface LabelRepository {
  /** Ordered by name */
  findByProject(projectId: ProjectId): Promise<Label[]>;
  create(projectId: ProjectId, data: LabelData): Promise<Label>;
  update(projectId: ProjectId, labelId: LabelId, changes: Partial<LabelData>): Promise<Label>;
  /** Removes the label from every task of the project too */
  delete(projectId: ProjectId, labelId: LabelId): Promise<void>;
}
