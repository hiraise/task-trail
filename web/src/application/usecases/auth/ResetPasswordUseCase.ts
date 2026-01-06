import type { ResetPasswordPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class ResetPasswordUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(payload: ResetPasswordPayload): Promise<void> {
    try {
      clientLogger.info("ResetPasswordUseCase: executing");
      await this.authRepository.resetPassword(payload.token, payload.password);
      clientLogger.info("ResetPasswordUseCase: End successfully");
    } catch (error) {
      clientLogger.error("ResetPasswordUseCase: failed", { error, payload });
      throw error;
    }
  }
}
