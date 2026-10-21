import type { User } from "@/domain/models/User";

export interface AuthStatusDto {
  isAuthenticated: boolean;
  authInitializing?: boolean;
  user?: User | null;
}
