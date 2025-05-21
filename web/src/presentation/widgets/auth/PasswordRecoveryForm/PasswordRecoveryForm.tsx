import { FormEvent, useState } from "react";
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
import { PASSWORD_RECOVERY_FIELDS } from "@/shared/constants/formFields";
import { useFormErrors } from "@/shared/hooks/useFormErrors";
import { validateEmail, validators } from "@/shared/utils/validate";

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
`;

export default function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const { recover, loading } = usePasswordRecovery();
  const {
    errors,
    setFieldError,
    resetErrors,
    validateAllFields,
    clearFieldError,
  } = useFormErrors(PASSWORD_RECOVERY_FIELDS.all, validators);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetErrors();

    const values = { email };
    if (!validateAllFields(values)) return;

    await recover(email);
    resetErrors();
  };

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    const error = validateEmail(e.target.value);
    if (error) {
      setFieldError(PASSWORD_RECOVERY_FIELDS.email, error);
    } else {
      clearFieldError(PASSWORD_RECOVERY_FIELDS.email);
    }
  };

  return (
    <MobileContainer>
      <FormContainer noValidate onSubmit={handleSubmit}>
        <Stack gap="4px">
          <InputLabel htmlFor="email">{sharedTexts.emailLabel}</InputLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={loginTexts.emailPlaceholder}
            value={email}
            onChange={onChangeEmail}
            required
          />
          {errors[PASSWORD_RECOVERY_FIELDS.email] && (
            <FormFieldError>
              {errors[PASSWORD_RECOVERY_FIELDS.email]}
            </FormFieldError>
          )}
        </Stack>
        <Spacer size="20px" />
        <SubmitButton type="submit" disabled={loading}>
          {loading ? sharedTexts.sending : sharedTexts.send}
        </SubmitButton>
      </FormContainer>
      <Spacer size="8px" />
      <PrivacyText btnName={sharedTexts.send} />
    </MobileContainer>
  );
}
