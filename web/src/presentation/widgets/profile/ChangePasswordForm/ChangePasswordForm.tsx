import { useForm } from "react-hook-form";

import styles from "./ChangePasswordForm.module.css";
import { Input, InputLabel } from "../../auth/LoginForm/LoginForm.styled";
import { Stack } from "../../primitives/Stack";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import {
  getConfirmPasswordValidator,
  getNewPasswordValidator,
  oldPasswordValidator,
} from "@/shared/utils/validate";

const formTexts = {
  oldPasswordLabel: "Введите старый пароль",
  newPasswordLabel: "Введите новый пароль",
  confirmPasswordLabel: "Повторите новый пароль",
  changePassword: "Изменить пароль",
  passwordPlaceholder: "********",
};

type FormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface Props {
  onSubmit: (
    data: Pick<FormValues, "oldPassword" | "newPassword">
  ) => void | Promise<void>;
  isLoading?: boolean;
}

export function ChangePasswordForm({ onSubmit, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
  });

  const newPassword = watch("newPassword");
  const oldPassword = watch("oldPassword");

  const submitHandler = (data: FormValues) => {
    return onSubmit({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className={styles["form-flex"]}
    >
      <div className={styles["form-fields-container"]}>
        <Stack gap="4px">
          <InputLabel htmlFor="oldPassword">
            {formTexts.oldPasswordLabel}
          </InputLabel>
          <Input
            id="oldPassword"
            type="password"
            {...register("oldPassword", oldPasswordValidator)}
            aria-invalid={!!errors.oldPassword}
            aria-describedby="oldPassword-error"
            placeholder={formTexts.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.oldPassword && (
            <FormFieldError>{errors.oldPassword.message}</FormFieldError>
          )}
        </Stack>
        <Stack gap="4px">
          <InputLabel htmlFor="newPassword">
            {formTexts.newPasswordLabel}
          </InputLabel>
          <Input
            id="newPassword"
            type="password"
            {...register("newPassword", getNewPasswordValidator(oldPassword))}
            aria-invalid={!!errors.newPassword}
            aria-describedby="newPassword-error"
            placeholder={formTexts.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.newPassword && (
            <FormFieldError>{errors.newPassword.message}</FormFieldError>
          )}
        </Stack>
        <Stack gap="4px">
          <InputLabel htmlFor="confirmPassword">
            {formTexts.confirmPasswordLabel}
          </InputLabel>
          <Input
            id="confirmPassword"
            type="password"
            {...register(
              "confirmPassword",
              getConfirmPasswordValidator(newPassword)
            )}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirmPassword-error"
            placeholder={formTexts.passwordPlaceholder}
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
          disabled={isSubmitting}
          className={styles["change-password-btn"]}
        >
          {isSubmitting || isLoading
            ? "Загрузка... "
            : formTexts.changePassword}
        </SubmitButton>
      </div>
    </form>
  );
}
