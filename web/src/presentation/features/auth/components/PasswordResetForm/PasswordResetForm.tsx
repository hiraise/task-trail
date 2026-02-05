import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormFieldError, Input, SubmitButton } from "@/presentation/shared";
import { authTexts } from "@/shared/locales/auth";

import styles from "./PasswordResetForm.module.css";
import { PasswordResetSchema, type PasswordResetFormData } from "./schema";

interface PasswordResetFormProps {
  onSubmit: (password: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function PasswordResetForm({ onSubmit, isLoading }: PasswordResetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(PasswordResetSchema),
    mode: "onChange",
  });

  const submitHandler = (data: PasswordResetFormData) => {
    const { password } = data;

    return onSubmit(password);
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
            {...register("password")}
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
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirmPassword-error"
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
