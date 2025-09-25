import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import styles from "./ChangePasswordFormMobile.module.css";

import { FormValues, schema } from "./schema";
import { TEXTS } from "@/shared/locales/texts";
import { Stack } from "../../primitives/Stack";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { Input, InputLabel } from "@/presentation/ui/Input";
import { usePasswordChange } from "@/application/auth/hooks/usePasswordChange";

export function ChangePasswordFormMobile() {
  const { mutateAsync: changePassword } = usePasswordChange();

  const form = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onChange" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const submitHandler = async (data: FormValues) => {
    if (!isValid) return;
    await changePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles["form-flex"]}>
      <div className={styles["form-fields-container"]}>
        <Stack gap="4px">
          <InputLabel htmlFor="oldPassword">{TEXTS.profile.oldPasswordLabel}</InputLabel>
          <Input
            id="oldPassword"
            type="password"
            {...register("oldPassword")}
            aria-invalid={!!errors.oldPassword}
            aria-describedby="oldPassword-error"
            placeholder={TEXTS.profile.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.oldPassword && <FormFieldError>{errors.oldPassword.message}</FormFieldError>}
        </Stack>
        <Stack gap="4px">
          <InputLabel htmlFor="newPassword">{TEXTS.profile.newPasswordLabel}</InputLabel>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword")}
            aria-invalid={!!errors.newPassword}
            aria-describedby="newPassword-error"
            placeholder={TEXTS.profile.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.newPassword && <FormFieldError>{errors.newPassword.message}</FormFieldError>}
        </Stack>
        <Stack gap="4px">
          <InputLabel htmlFor="confirmPassword">{TEXTS.profile.confirmPasswordLabel}</InputLabel>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirmPassword-error"
            placeholder={TEXTS.profile.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.confirmPassword && (
            <FormFieldError>{errors.confirmPassword.message}</FormFieldError>
          )}
        </Stack>
      </div>
      <div className={styles["btn-container"]}>
        <SubmitButton
          type="submit"
          disabled={!isValid || isSubmitting}
          className={styles["change-password-btn"]}
        >
          {TEXTS.save}
        </SubmitButton>
      </div>
    </form>
  );
}
