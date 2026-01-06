import type { VerifyEmailPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class VerifyEmailUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(payload: VerifyEmailPayload): Promise<void> {
    try {
      clientLogger.info("VerifyEmailUseCase: executing");
      await this.authRepository.verifyEmail(payload.token);
      clientLogger.info("VerifyEmailUseCase: End successfully");
    } catch (error) {
      clientLogger.error("VerifyEmailUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
