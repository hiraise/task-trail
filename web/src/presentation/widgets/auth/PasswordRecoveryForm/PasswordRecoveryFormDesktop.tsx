import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./PasswordRecoveryFormDesktop.module.css";

import { usePasswordRecovery } from "@/application/auth/hooks/usePasswordRecovery";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";
import { ICONS } from "@/infrastructure/config/icons";
import { Input, InputStack, SubmitButton } from "../_components";
import { authTexts } from "@/shared/locales/auth";
import { schema, type FormData } from "./schema";

export function PasswordRecoveryFormDesktop() {
  const { mutateAsync: recover, isPending: isLoading } = usePasswordRecovery();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormData>({ mode: "onChange", resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearErrors();
    try {
      await recover(data.email);
    } catch {
      setError("email", {
        type: "server",
        message: "Ошибка сервера. Попробуйте ещё раз.",
      });
    }
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      <InputStack>
        <Input
          icon={ICONS.mail}
          id="email"
          type="email"
          {...register("email")}
          placeholder="Email"
          label="email"
          autoComplete="email"
          hasError={!!errors.email}
        />
        {errors.email && <FormFieldError>{errors.email.message as string}</FormFieldError>}
      </InputStack>
      <div className={styles.formItems}>
        <SubmitButton className="btn-font-m" disabled={!isValid || isSubmitting}>
          {isSubmitting || isLoading ? authTexts.sending : authTexts.send}
        </SubmitButton>
        <PrivacyPolicyDesktop btnName={authTexts.send} />
      </div>
    </form>
  );
}
