import type { AuthStatusDto } from "@/application/dto/AuthStatusDto";
import { userRepository } from "@/infrastructure/repositories";

// Вошёл ли пользователь: GET /v1/users/me без сессии отвечает 401, а HTTP-клиент сначала
// пробует обновить сессию — отдельный запрос /auth/check не нужен.
export async function checkAuthStatusUseCase(): Promise<AuthStatusDto> {
  try {
    const currentUser = await userRepository.getCurrentUser();

    return { isAuthenticated: true, user: currentUser };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}
