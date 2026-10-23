import type { LabelRepository } from "@/domain/repositories/LabelRepository";

import type { CreateLabelRequest, Label, UpdateLabelRequest } from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

import { toLabel } from "./mappers";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createLabelRepository = (http: HttpClient): LabelRepository => ({
  findByProject: async (projectId) =>
    (await http.get<Label[]>(API_ROUTES.PROJECT_LABELS(projectId))).map(toLabel),

  create: async (projectId, { name, color }) => {
    const body: CreateLabelRequest = { name, color };

    return toLabel(await http.post<Label>(API_ROUTES.PROJECT_LABELS(projectId), body));
  },

  update: async (projectId, labelId, changes) => {
    const body: UpdateLabelRequest = changes;

    return toLabel(await http.patch<Label>(API_ROUTES.PROJECT_LABEL(projectId, labelId), body));
  },

  delete: async (projectId, labelId) => {
    await http.delete(API_ROUTES.PROJECT_LABEL(projectId, labelId));
  },
});

export const labelRepository: LabelRepository = createLabelRepository(axiosClient);
