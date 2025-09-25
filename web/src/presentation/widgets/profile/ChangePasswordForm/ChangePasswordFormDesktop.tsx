import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion as m } from "framer-motion";

import styles from "./ChangePasswordFormDesktop.module.css";

import { FormValues, schema } from "./schema";
import { TEXTS } from "@/shared/locales/texts";
import { InputLabel } from "@/presentation/ui/Input";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "../../auth/_components";
import { usePasswordChange } from "@/application/auth/hooks/usePasswordChange";
import { PasswordInputField } from "./PasswordInputField";

export function ChangePasswordFormDesktop() {
  const { mutateAsync: changePassword } = usePasswordChange();

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onChange" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const [focused, setFocused] = useState(false);

  const handleCancel = () => {
    form.reset();
    setFocused(false);
  };

  const submitHandler = async (data: FormValues) => {
    if (!isValid) return;
    await changePassword({ newPassword: data.newPassword, oldPassword: data.oldPassword });
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(submitHandler)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div className={styles.inputFields}>
        <div className={styles.field}>
          <InputLabel htmlFor="oldPassword">{TEXTS.profile.oldPasswordLabel}</InputLabel>
          <PasswordInputField
            id="oldPassword"
            {...register("oldPassword")}
            placeholder={TEXTS.profile.passwordPlaceholder}
            aria-invalid={!!errors.oldPassword}
            aria-describedby="currentPassword-error"
            disabled={isSubmitting}
            autoComplete="off"
          />

          {errors.oldPassword && <FormFieldError>{errors.oldPassword.message}</FormFieldError>}
        </div>
        <div className={styles.field}>
          <InputLabel htmlFor="newPassword">{TEXTS.profile.newPasswordLabel}</InputLabel>
          <PasswordInputField
            id="newPassword"
            {...register("newPassword")}
            placeholder={TEXTS.profile.passwordPlaceholder}
            aria-invalid={!!errors.newPassword}
            aria-describedby="newPassword-error"
            disabled={isSubmitting}
            autoComplete="off"
          />

          {errors.newPassword && <FormFieldError>{errors.newPassword.message}</FormFieldError>}
        </div>
        <div className={styles.field}>
          <InputLabel htmlFor="confirmPassword">{TEXTS.profile.confirmPasswordLabel}</InputLabel>
          <PasswordInputField
            id="confirmPassword"
            {...register("confirmPassword")}
            placeholder={TEXTS.profile.passwordPlaceholder}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirmPassword-error"
            disabled={isSubmitting}
            autoComplete="off"
          />

          {errors.confirmPassword && (
            <FormFieldError>{errors.confirmPassword.message}</FormFieldError>
          )}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {focused && (
          <m.div
            key="buttons"
            className={styles.buttons}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ type: "tween", duration: 0.15 }}
          >
            <SubmitButton
              $variant="secondary"
              type="button"
              onClick={handleCancel}
              className="btn-font-s"
            >
              {TEXTS.cancel}
            </SubmitButton>
            <SubmitButton
              $variant="primary"
              type="submit"
              className="btn-font-s"
              disabled={!isValid || isSubmitting}
            >
              {TEXTS.save}
            </SubmitButton>
          </m.div>
        )}
      </AnimatePresence>
    </form>
  );
}
