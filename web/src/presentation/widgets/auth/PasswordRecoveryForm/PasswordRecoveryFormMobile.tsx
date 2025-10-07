"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./PasswordRecoveryFormMobile.module.css";

import { usePasswordRecovery } from "@/application/auth/hooks/usePasswordRecovery";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { authTexts } from "@/shared/locales/auth";
import { schema, type FormData } from "./schema";
import { Input, InputStack, SubmitButton } from "../_components";
import { ICONS } from "@/infrastructure/config/icons";
import { PrivacyPolicyDesktop } from "../PrivacyPolicyText";

export function PasswordRecoveryFormMobile() {
  const { mutateAsync: recover, isPending: isLoading } = usePasswordRecovery();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({ mode: "onChange", resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!isValid) return;
    await recover(data.email);
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
        <SubmitButton className="btn-font-m" disabled={isLoading || isSubmitting}>
          {isSubmitting || isLoading ? authTexts.sending : authTexts.send}
        </SubmitButton>
        <PrivacyPolicyDesktop btnName={authTexts.send} />
      </div>
    </form>
  );
}
