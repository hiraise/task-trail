import type { ChangePasswordPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class ChangePasswordUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(payload: ChangePasswordPayload): Promise<void> {
    try {
      clientLogger.info("ChangePasswordUseCase: executing");

      await this.authRepository.changePassword(payload.oldPassword, payload.newPassword);
      clientLogger.info("Password changed successfully");
    } catch (error) {
      clientLogger.error("ChangePasswordUseCase: failed", { error, payload });
      throw error;
    }
  }
}
