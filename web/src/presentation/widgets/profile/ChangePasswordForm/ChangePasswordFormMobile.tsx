import { useForm } from "react-hook-form";

import styles from "./ChangePasswordFormMobile.module.css";
import { Stack } from "../../primitives/Stack";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { ChangePasswordData, FormValues } from "./ChangePassword.types";
import { Input, InputLabel } from "@/presentation/ui/Input";
import { TEXTS } from "@/shared/locales/texts";

interface Props {
  onSubmit: (data: ChangePasswordData) => void | Promise<void>;
  isLoading?: boolean;
}

export function ChangePasswordFormMobile({ onSubmit, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: "onBlur" });

  const newPassword = watch("newPassword");
  const oldPassword = watch("oldPassword");

  const submitHandler = (data: FormValues) => {
    return onSubmit({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles["form-flex"]}>
      <div className={styles["form-fields-container"]}>
        <Stack gap="4px">
          <InputLabel htmlFor="oldPassword">{TEXTS.profile.oldPasswordLabel}</InputLabel>
          <Input
            id="oldPassword"
            type="password"
            // {...register("oldPassword", oldPasswordValidator)}
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
            // {...register("newPassword", getNewPasswordValidator(oldPassword))}
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
            // {...register("confirmPassword", getConfirmPasswordValidator(newPassword))}
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
          {isSubmitting || isLoading ? "Загрузка... " : TEXTS.changePassword}
        </SubmitButton>
      </div>
    </form>
  );
}
