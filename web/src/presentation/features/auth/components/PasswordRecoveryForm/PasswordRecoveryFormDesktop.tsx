import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useRecoveryPassword } from "@/presentation/features/auth/hooks";
import { FormFieldError, IconInput, SubmitButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { authTexts } from "@/shared/locales/auth";

import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";

import styles from "./PasswordRecoveryFormDesktop.module.css";
import { schema, type FormData } from "./schema";

export function PasswordRecoveryFormDesktop() {
  const { mutateAsync: recover, isPending: isLoading } = useRecoveryPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({ mode: "onChange", resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await recover({ email: data.email });
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.inputWrapper}>
        <IconInput
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
      </div>
      <div className={styles.formItems}>
        <SubmitButton className="btn-font-m" disabled={!isValid || isSubmitting}>
          {isSubmitting || isLoading ? authTexts.sending : authTexts.send}
        </SubmitButton>
        <PrivacyPolicyDesktop btnName={authTexts.send} />
      </div>
    </form>
  );
}
