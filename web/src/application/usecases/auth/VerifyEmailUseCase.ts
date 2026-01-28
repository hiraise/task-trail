import type { VerifyEmailPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type VerifyEmailUseCase = (payload: VerifyEmailPayload) => Promise<void>;

const createVerifyEmailUseCase =
  (authRepository: AuthRepository): VerifyEmailUseCase =>
  async (payload) => {
    try {
      clientLogger.info("VerifyEmailUseCase: executing");
      await authRepository.verifyEmail(payload.token);
      clientLogger.info("VerifyEmailUseCase: End successfully");
    } catch (error) {
      clientLogger.error("VerifyEmailUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createVerifyEmailUseCase, type VerifyEmailUseCase };
