import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Spacer } from "../../primitives/Spacer";
import { MobileContainer } from "../../primitives/MobileContainer";
import { Form } from "./LoginFormMobile.styled";
import { loginTexts } from "@/shared/locales/login";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { LoginFields } from "../../common/LoginFields";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { TextButton } from "@/presentation/ui/TextButton";
import { useLogin } from "@/application/auth/hooks/useLogin";
import { Spinner } from "@/presentation/ui/Spinner";
import { ROUTES } from "@/infrastructure/config/routes";
import { PrivacyPolicyMobile } from "../PrivacyPolicyText";

export const LoginFormMobile = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const { mutateAsync: login, isPending: loading } = useLogin();

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
        <TextButton onClick={() => router.push(ROUTES.passwordRecovery)}>
          {loginTexts.forgotPassword}
        </TextButton>
        <Spacer size="20px" />
        <SubmitButton type="submit" disabled={loading}>
          {loading ? <Spinner size={16} /> : sharedTexts.login}
        </SubmitButton>
      </Form>
      <Spacer size="8px" />
      <PrivacyPolicyMobile btnName={sharedTexts.login} />
    </MobileContainer>
  );
};
