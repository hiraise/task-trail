import type { SettingsRepository } from "@/domain/repositories/SettingsRepository";

import type { PublicSettings } from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

const createSettingsRepository = (http: HttpClient): SettingsRepository => ({
  getPublic: async () => {
    const dto = await http.get<PublicSettings>(API_ROUTES.PUBLIC_SETTINGS);

    return { registrationOpen: dto.registrationOpen, mailEnabled: dto.mailEnabled };
  },
});

export const settingsRepository: SettingsRepository = createSettingsRepository(axiosClient);
