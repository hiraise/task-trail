import type { EmailPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { Email } from "@/domain/valueobjects/Email";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class RecoveryPasswordUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(payload: EmailPayload): Promise<string> {
    try {
      clientLogger.info("RecoveryPasswordUseCase: executing");
      const email = Email.create(payload.email);
      await this.authRepository.forgotPassword(email);
      clientLogger.info("RecoveryPasswordUseCase: End successfully");
      return payload.email;
    } catch (error) {
      clientLogger.error("RecoveryPasswordUseCase: failed", { error, payload });
      throw error;
    }
  }
}
