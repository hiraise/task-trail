import type { AuthPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { Email } from "@/domain/valueobjects/Email";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class SignUpUseCase {
  constructor(private authRepository: AuthRepository) {}

  async execute(payload: AuthPayload): Promise<void> {
    try {
      clientLogger.info("SignUpUseCase: executing", { email: payload.email });

      const email = Email.create(payload.email);
      await this.authRepository.signUp(email, payload.password);

      clientLogger.info("SignUpUseCase: completed successfully", { email: payload.email });
    } catch (error) {
      clientLogger.error("SignUpUseCase: failed", {
        error,
        email: payload.email,
      });
      throw error;
    }
  }
}
