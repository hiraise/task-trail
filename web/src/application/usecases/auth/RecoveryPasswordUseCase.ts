import type { EmailPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { Email } from "@/domain/valueobjects/Email";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type RecoveryPasswordUseCase = (payload: EmailPayload) => Promise<string>;

const createRecoveryPasswordUseCase =
  (authRepository: AuthRepository): RecoveryPasswordUseCase =>
  async (payload) => {
    try {
      clientLogger.info("RecoveryPasswordUseCase: executing");
      const email = Email.create(payload.email);
      await authRepository.forgotPassword(email);
      clientLogger.info("RecoveryPasswordUseCase: End successfully");
      return payload.email;
    } catch (error) {
      clientLogger.error("RecoveryPasswordUseCase: failed", { error, payload });
      throw error;
    }
  };

export { createRecoveryPasswordUseCase, type RecoveryPasswordUseCase };
