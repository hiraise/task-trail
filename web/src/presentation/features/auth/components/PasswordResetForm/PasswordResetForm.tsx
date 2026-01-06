import { useForm } from "react-hook-form";

import { FormFieldError, Input, SubmitButton } from "@/presentation/shared";
import { authTexts } from "@/shared/locales/auth";
import { getConfirmPasswordValidator, getPasswordValidator } from "@/shared/utils/validate";

import styles from "./PasswordResetForm.module.css";

interface FormValues {
  password: string;
  confirmPassword: string;
}

interface PasswordResetFormProps {
  onSubmit: (password: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function PasswordResetForm({ onSubmit, isLoading }: PasswordResetFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ mode: "onChange" });

  const password = watch("password");

  const submitHandler = (data: FormValues) => {
    return onSubmit(data.password);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className={styles.formFlex}>
      <div className={styles.formFieldsContainer}>
        <div className={styles.inputs}>
          <label htmlFor="password" className="body-med">
            {authTexts.enterNewPassword}
          </label>
          <Input
            id="password"
            type="password"
            {...register("password", getPasswordValidator())}
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
            placeholder={authTexts.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.password && <FormFieldError>{errors.password.message}</FormFieldError>}
        </div>
        <div className={styles.inputs}>
          <label htmlFor="confirmPassword" className="body-med">
            {authTexts.confirmNewPassword}
          </label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword", getConfirmPasswordValidator(password))}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="newPassword-error"
            placeholder={authTexts.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.confirmPassword && (
            <FormFieldError>{errors.confirmPassword.message}</FormFieldError>
          )}
        </div>
      </div>
      <div className={styles.btnContainer}>
        <SubmitButton
          type="submit"
          disabled={!isValid || isSubmitting}
          className={styles.changePasswordBtn}
        >
          {isSubmitting || isLoading ? authTexts.changingPassword : authTexts.changePassword}
        </SubmitButton>
      </div>
    </form>
  );
}
