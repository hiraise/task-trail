import type { AuthStatusDto } from "@/application/dto/AuthStatusDto";
import { GetCurrentUserUseCase } from "@/application/usecases/user/GetCurrentUserUseCase";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class CheckAuthStatusUseCase {
  private readonly getCurrentUserUseCase: GetCurrentUserUseCase;

  constructor(private readonly authRepository: AuthRepository, userRepository: UserRepository) {
    this.getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
  }

  async execute(): Promise<AuthStatusDto> {
    try {
      clientLogger.info("CheckAuthStatusUseCase: execution");
      await this.authRepository.checkAuthStatus();

      // Get current user information
      const currentUser = await this.getCurrentUserUseCase.execute();
      clientLogger.info("CheckAuthStatusUseCase: completed successfully");

      return {
        isAuthenticated: true,
        user: currentUser,
      };
    } catch (error) {
      clientLogger.info("CheckAuthStatusUseCase: failed", { error });
      return {
        isAuthenticated: false,
        user: null,
      };
    }
  }
}
