import type { EmailPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { Email } from "@/domain/valueobjects/Email";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type ResendEmailVerificationUseCase = (payload: EmailPayload) => Promise<string>;

const createResendEmailVerificationUseCase =
  (authRepository: AuthRepository): ResendEmailVerificationUseCase =>
  async (payload) => {
    try {
      clientLogger.info("ResendEmailVerificationUseCase: executing");
      const email = Email.create(payload.email);
      await authRepository.resendEmailVerification(email);
      clientLogger.info("ResendEmailVerificationUseCase: End successfully");
      return payload.email;
    } catch (error) {
      clientLogger.error("ResendEmailVerificationUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createResendEmailVerificationUseCase, type ResendEmailVerificationUseCase };
