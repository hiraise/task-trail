import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./ChangePasswordFormMobile.module.css";

import { FormValues, schema } from "./schema";
import { TEXTS } from "@/shared/locales/texts";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { usePasswordChange } from "@/application/auth/hooks/usePasswordChange";
import { InputFieldMobile } from "../_components/InputFieldMobile";

export function ChangePasswordFormMobile() {
  const { mutateAsync: changePassword } = usePasswordChange();

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onSubmit" });

  const {
    watch,
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const submitHandler = async (data: FormValues) => {
    if (!isValid) return;
    await changePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.form}>
      <div className={styles.formField}>
        <label htmlFor="oldPassword" className="body-med">
          {TEXTS.profile.oldPasswordLabel}
        </label>
        <div className={styles.input} style={{ paddingBottom: "12px" }}>
          <InputFieldMobile
            id="oldPassword"
            {...register("oldPassword")}
            placeholder={TEXTS.profile.passwordPlaceholder}
            aria-invalid={!!errors.oldPassword}
            aria-describedby="oldPassword-error"
            disabled={isSubmitting}
            autoComplete="off"
            mode="password"
            hasError={!!errors.oldPassword}
            showSuffixButton={!!watch("oldPassword")}
          />
          {errors.oldPassword && <FormFieldError>{errors.oldPassword.message}</FormFieldError>}
        </div>
      </div>

      <div className={styles.formField}>
        <label htmlFor="newPassword" className="body-med">
          {TEXTS.profile.newPasswordLabel}
        </label>
        <div className={styles.input}>
          <InputFieldMobile
            id="newPassword"
            {...register("newPassword")}
            placeholder={TEXTS.profile.passwordPlaceholder}
            aria-invalid={!!errors.newPassword}
            aria-describedby="newPassword-error"
            disabled={isSubmitting}
            autoComplete="off"
            mode="password"
            hasError={!!errors.newPassword}
            showSuffixButton={!!watch("newPassword")}
          />
          {errors.newPassword && <FormFieldError>{errors.newPassword.message}</FormFieldError>}
        </div>
      </div>

      <div className={styles.formField}>
        <label htmlFor="confirmPassword" className="body-med">
          {TEXTS.profile.confirmPasswordLabel}
        </label>
        <div className={styles.input}>
          <InputFieldMobile
            id="confirmPassword"
            {...register("confirmPassword")}
            placeholder={TEXTS.profile.passwordPlaceholder}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirmPassword-error"
            disabled={isSubmitting}
            autoComplete="off"
            mode="password"
            hasError={!!errors.confirmPassword}
            showSuffixButton={!!watch("confirmPassword")}
          />
          {errors.confirmPassword && (
            <FormFieldError>{errors.confirmPassword.message}</FormFieldError>
          )}
        </div>
      </div>

      <div className={styles.button}>
        <SubmitButton type="submit" className="btn-font-m">
          {TEXTS.save}
        </SubmitButton>
      </div>
    </form>
  );
}
