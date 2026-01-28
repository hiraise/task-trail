import type { ChangePasswordPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type ChangePasswordUseCase = (payload: ChangePasswordPayload) => Promise<void>;

const createChangePasswordUseCase =
  (authRepository: AuthRepository): ChangePasswordUseCase =>
  async (payload) => {
    try {
      clientLogger.info("ChangePasswordUseCase: executing");

      await authRepository.changePassword(payload.oldPassword, payload.newPassword);
      clientLogger.info("Password changed successfully");
    } catch (error) {
      clientLogger.error("ChangePasswordUseCase: failed", { error, payload });
      throw error;
    }
  };

export { createChangePasswordUseCase, type ChangePasswordUseCase };
