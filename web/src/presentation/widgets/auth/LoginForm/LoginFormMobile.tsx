import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

import { Form } from "./LoginForm.styled";
import { loginTexts } from "@/shared/locales/login";
import { ROUTES } from "@/infrastructure/config/routes";
import { toastLogin } from "@/shared/lib/toastLogin";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { MobileContainer } from "../../primitives/MobileContainer";
import { LoginFields } from "../../common/LoginFields";
import { Spacer } from "../../primitives/Spacer";
import { TextButton } from "@/presentation/ui/TextButton";
import { PrivacyText } from "../../common/PrivacyText";
import { useLogin } from "@/application/auth/hooks/useLogin";

export const ErrorText = styled.p`
  color: red;
  font-size: 14px;
  margin-top: -8px;
  margin-bottom: 8px;
  text-align: center;
`;

export const LoginFormMobile = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loading } = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await toastLogin(() => login(email, password));
      router.push(ROUTES.dashboard);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <MobileContainer>
      <Form onSubmit={handleSubmit}>
        <LoginFields
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        ></LoginFields>
        <Spacer size="12px" />
        <TextButton>{loginTexts.forgotPassword}</TextButton>
        <Spacer size="20px" />
        <SubmitButton type="submit" disabled={loading}>
          {/* TODO: move text to constants */}
          {loading ? "Вход в систему..." : sharedTexts.login}
        </SubmitButton>
      </Form>
      <Spacer size="8px" />
      <PrivacyText />
    </MobileContainer>
  );
};
