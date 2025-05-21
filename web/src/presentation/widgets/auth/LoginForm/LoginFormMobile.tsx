import { FormEvent, useState } from "react";

import { Spacer } from "../../primitives/Spacer";
import { MobileContainer } from "../../primitives/MobileContainer";
import { Form } from "./LoginForm.styled";
import { loginTexts } from "@/shared/locales/login";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { LoginFields } from "../../common/LoginFields";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { TextButton } from "@/presentation/ui/TextButton";
import { useLogin } from "@/application/auth/hooks/useLogin";
import PrivacyText from "../../common/PrivacyText";

export const LoginFormMobile = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, loading } = useLogin();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
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
          {loading ? loginTexts.loggingIn : sharedTexts.login}
        </SubmitButton>
      </Form>
      <Spacer size="8px" />
      <PrivacyText btnName={sharedTexts.login} />
    </MobileContainer>
  );
};
