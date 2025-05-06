import styled from "styled-components";

import { Stack } from "../primitives/Stack";
import { loginTexts } from "@/shared/locales/login";
import { Input, InputLabel } from "../auth/LoginForm/LoginForm.styled";

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

export const LoginFields = ({
  email,
  setEmail,
  password,
  setPassword,
}: LoginFieldsProps) => {
  return (
    <InputContainer>
      <Stack gap="4px">
        <InputLabel htmlFor="email">{loginTexts.emailLabel}</InputLabel>
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
