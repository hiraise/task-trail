import type { AuthStatusDto } from "@/application/dto/AuthStatusDto";
import { userRepository } from "@/infrastructure/repositories";

// Whether the user is signed in: GET /v1/users/me responds 401 without a session, and the HTTP client first
// tries to refresh the session — a separate /auth/check request is not needed.
export async function checkAuthStatusUseCase(): Promise<AuthStatusDto> {
  try {
    const currentUser = await userRepository.getCurrentUser();

    return { isAuthenticated: true, user: currentUser };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}
