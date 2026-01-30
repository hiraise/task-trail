import type { AuthStatusDto } from "@/application/dto/AuthStatusDto";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

import type { GetCurrentUserUseCase } from "../user";

type CheckAuthStatusUseCase = () => Promise<AuthStatusDto>;

const createCheckAuthStatusUseCase =
  (authRepository: AuthRepository, getCurrentUserUseCase: GetCurrentUserUseCase) => async () => {
    try {
      clientLogger.info("CheckAuthStatusUseCase: execution");
      await authRepository.checkAuthStatus();

      // Get current user information
      const currentUser = await getCurrentUserUseCase();

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
  };

export { createCheckAuthStatusUseCase, type CheckAuthStatusUseCase };
