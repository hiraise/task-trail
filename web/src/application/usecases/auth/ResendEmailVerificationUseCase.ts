import type { EmailPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { Email } from "@/domain/valueobjects/Email";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class ResendEmailVerificationUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(payload: EmailPayload): Promise<string> {
    try {
      clientLogger.info("ResendEmailVerificationUseCase: executing");
      const email = Email.create(payload.email);
      await this.authRepository.resendEmailVerification(email);
      clientLogger.info("ResendEmailVerificationUseCase: End successfully");
      return payload.email;
    } catch (error) {
      clientLogger.error("ResendEmailVerificationUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
