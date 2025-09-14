import styled from "styled-components";

import { Stack } from "../../primitives/Stack";
import { Input, InputLabel } from "@/presentation/ui/Input";
import { authTexts } from "@/shared/locales/auth";

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
        <InputLabel htmlFor="email">{authTexts.emailPlaceholder}</InputLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={authTexts.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Stack>
      <Stack gap="4px">
        <InputLabel htmlFor="password">{authTexts.passwordPlaceholder}</InputLabel>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={authTexts.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Stack>
    </InputContainer>
  );
};
