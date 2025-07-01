import { useForm } from "react-hook-form";
import styled from "styled-components";

import { Spacer } from "../../primitives/Spacer";
import { MobileContainer } from "../../primitives/MobileContainer";
import { loginTexts } from "@/shared/locales/login";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import PrivacyText from "../../common/PrivacyText";
import { Stack } from "../../primitives/Stack";
import { Input, InputLabel } from "../LoginForm/LoginForm.styled";
import { usePasswordRecovery } from "@/application/auth/hooks/usePasswordRecovery";
import { FormFieldError } from "@/presentation/ui/FormFieldError";
import { getEmailValidator } from "@/shared/utils/validate";

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
`;

type FormValues = {
  email: string;
};

export default function PasswordRecoveryForm() {
  const { recover, loading } = usePasswordRecovery();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({ mode: "onChange" });

  const onSubmit = async (data: FormValues) => {
    clearErrors();
    try {
      await recover(data.email);
    } catch {
      setError("email", {
        type: "server",
        message: "Ошибка сервера. Попробуйте ещё раз.",
      });
    }
  };

  return (
    <MobileContainer>
      <FormContainer noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="4px">
          <InputLabel htmlFor="email">{sharedTexts.emailLabel}</InputLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={loginTexts.emailPlaceholder}
            {...register("email", getEmailValidator())}
          />
          {errors.email && (
            <FormFieldError>{errors.email.message}</FormFieldError>
          )}
        </Stack>
        <Spacer size="20px" />
        <SubmitButton type="submit" disabled={loading || isSubmitting}>
          {loading ? sharedTexts.sending : sharedTexts.send}
        </SubmitButton>
      </FormContainer>
      <Spacer size="8px" />
      <PrivacyText btnName={sharedTexts.send} />
    </MobileContainer>
  );
}
