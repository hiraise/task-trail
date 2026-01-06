import type { UserResponseDto } from "./UserResponseDto";

export interface AuthStatusDto {
  isAuthenticated: boolean;
  authInitializing?: boolean;
  user?: UserResponseDto | null;
}
