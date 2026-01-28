import type { ResetPasswordPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type ResetPasswordUseCase = (payload: ResetPasswordPayload) => Promise<void>;

const createResetPasswordUseCase =
  (authRepository: AuthRepository): ResetPasswordUseCase =>
  async (payload) => {
    try {
      clientLogger.info("ResetPasswordUseCase: executing");
      await authRepository.resetPassword(payload.token, payload.password);
      clientLogger.info("ResetPasswordUseCase: End successfully");
    } catch (error) {
      clientLogger.error("ResetPasswordUseCase: failed", { error, payload });
      throw error;
    }
  };

export { createResetPasswordUseCase, type ResetPasswordUseCase };
