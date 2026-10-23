import type { LabelData } from "@/domain/repositories/LabelRepository";
import type { LabelId, ProjectId } from "@/domain/types";

export interface CreateLabelPayload {
  projectId: ProjectId;
  data: LabelData;
}

export interface UpdateLabelPayload {
  projectId: ProjectId;
  labelId: LabelId;
  changes: Partial<LabelData>;
}

export interface DeleteLabelPayload {
  projectId: ProjectId;
  labelId: LabelId;
}
