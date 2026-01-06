import type { AuthPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { Email } from "@/domain/valueobjects/Email";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class LoginUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(payload: AuthPayload): Promise<void> {
    try {
      clientLogger.info("LoginUseCase: executing", { email: payload.email });

      const email = Email.create(payload.email);
      await this.authRepository.login(email, payload.password);

      clientLogger.info("LoginUseCase: completed successfully", {
        email: payload.email,
      });
    } catch (error) {
      clientLogger.error("LoginUseCase: failed", {
        error,
        email: payload.email,
      });
      throw error;
    }
  }
}
