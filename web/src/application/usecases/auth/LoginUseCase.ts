import type { AuthPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type LoginUseCase = (payload: AuthPayload) => Promise<void>;

const createLoginUseCase =
  (authRepository: AuthRepository): LoginUseCase =>
  async (payload) => {
    try {
      clientLogger.info("LoginUseCase: executing", { email: payload.email });
      await authRepository.login(payload.email, payload.password);
      clientLogger.info("LoginUseCase: completed successfully", { email: payload.email });
    } catch (error) {
      clientLogger.error("LoginUseCase: failed", {
        error,
        email: payload.email,
      });
      throw error;
    }
  };

export { createLoginUseCase, type LoginUseCase };
