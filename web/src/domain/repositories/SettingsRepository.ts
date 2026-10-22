import type { PublicSettings } from "../models/PublicSettings";

export interface SettingsRepository {
  getPublic(): Promise<PublicSettings>;
}
