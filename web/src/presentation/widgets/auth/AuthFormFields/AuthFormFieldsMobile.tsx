import styled from "styled-components";

import { Stack } from "../../primitives/Stack";
import { loginTexts } from "@/shared/locales/login";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { Input, InputLabel } from "@/presentation/ui/Input";

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

interface LoginFieldsProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
}

export const AuthFormFieldsMobile = ({
  email,
  setEmail,
  password,
  setPassword,
}: LoginFieldsProps) => {
  return (
    <InputContainer>
      <Stack gap="4px">
        <InputLabel htmlFor="email">{sharedTexts.emailLabel}</InputLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={loginTexts.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Stack>
      <Stack gap="4px">
        <InputLabel htmlFor="password">{loginTexts.passwordLabel}</InputLabel>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={loginTexts.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Stack>
    </InputContainer>
  );
};
