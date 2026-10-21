import type { AuthStatusDto } from "@/application/dto/AuthStatusDto";
import { authRepository, userRepository } from "@/infrastructure/repositories";

export async function checkAuthStatusUseCase(): Promise<AuthStatusDto> {
  try {
    await authRepository.checkAuthStatus();

    const currentUser = await userRepository.getCurrentUser();

    return { isAuthenticated: true, user: currentUser };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}
