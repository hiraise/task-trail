import type { CurrentUser } from "@/domain/models/User";

export interface AuthStatusDto {
  isAuthenticated: boolean;
  authInitializing?: boolean;
  user?: CurrentUser | null;
}
