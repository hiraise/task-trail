"use client";

import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import "./styles.css";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { BackButton } from "@/presentation/ui/BackButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { getConfirmPasswordValidator, getPasswordValidator } from "@/shared/utils/validate";
import { Input, InputLabel } from "@/presentation/ui/Input";
import { Stack } from "@/presentation/widgets/primitives/Stack";
import { usePasswordReset } from "@/application/auth/hooks/usePasswordReset";

interface FormValues {
  password: string;
  confirmPassword: string;
}

const formTexts = {
  passwordLabel: "Введите новый пароль",
  confirmPasswordLabel: "Повторите новый пароль",
  changePassword: "Изменить пароль",
  passwordPlaceholder: "********",
};

interface Props {
  onSubmit: (password: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function PasswordResetForm({ onSubmit, isLoading }: Props) {
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
    <form onSubmit={handleSubmit(submitHandler)} className="form-flex">
      <div className="form-fields-container">
        <Stack gap="4px">
          <InputLabel htmlFor="password">{formTexts.passwordLabel}</InputLabel>
          <Input
            id="password"
            type="password"
            {...register("password", getPasswordValidator())}
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
            placeholder={formTexts.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.password && <FormFieldError>{errors.password.message}</FormFieldError>}
        </Stack>
        <Stack gap="4px">
          <InputLabel htmlFor="confirmPassword">{formTexts.confirmPasswordLabel}</InputLabel>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword", getConfirmPasswordValidator(password))}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="newPassword-error"
            placeholder={formTexts.passwordPlaceholder}
            disabled={isSubmitting}
            autoComplete="off"
          />
          {errors.confirmPassword && (
            <FormFieldError>{errors.confirmPassword.message}</FormFieldError>
          )}
        </Stack>
      </div>
      <div className={"btn-container"}>
        <SubmitButton
          type="submit"
          disabled={!isValid || isSubmitting}
          className={"change-password-btn"}
        >
          {isSubmitting || isLoading ? "Загрузка... " : formTexts.changePassword}
        </SubmitButton>
      </div>
    </form>
  );
}

export default function PasswordResetPage() {
  const { mutateAsync: resetPassword, isPending: isLoading } = usePasswordReset();

  const token = useSearchParams().get("token");

  const handleSubmit = async (password: string) => {
    if (!token) {
      toast.error("Что-то пошло не так");
      return;
    }
    await resetPassword({ password, token });
    console.log("Data");
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <Spacer size="80px" />
      <BackButton />
      <Spacer size="20px" />
      <PasswordResetForm onSubmit={handleSubmit} isLoading={isLoading} />
      <BottomNavBar />
    </MainContainer>
  );
}
