import type { LabelData } from "@/domain/repositories/LabelRepository";
import type { ProjectId } from "@/domain/types";

export interface CreateLabelPayload {
  projectId: ProjectId;
  data: LabelData;
}
