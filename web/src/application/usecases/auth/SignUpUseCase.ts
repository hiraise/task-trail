import type { AuthPayload } from "@/application/payloads";
import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { Email } from "@/domain/valueobjects/Email";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type SignUpUseCase = (payload: AuthPayload) => Promise<void>;

const createSignUpUseCase =
  (authRepository: AuthRepository): SignUpUseCase =>
  async (payload) => {
    try {
      clientLogger.info("SignUpUseCase: executing", { email: payload.email });

      const email = Email.create(payload.email);
      await authRepository.signUp(email, payload.password);

      clientLogger.info("SignUpUseCase: completed successfully", { email: payload.email });
    } catch (error) {
      clientLogger.error("SignUpUseCase: failed", {
        error,
        email: payload.email,
      });
      throw error;
    }
  };

export { createSignUpUseCase, type SignUpUseCase };
