"use client";

import { FormEvent, useState } from "react";

import { LoginFields } from "../../common/LoginFields";
import { PrivacyText } from "../../common/PrivacyText";
import { Spacer } from "../../primitives/Spacer";
import { MobileContainer } from "../../primitives/MobileContainer";
import { Form } from "../LoginForm/LoginForm.styled";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { signupTexts } from "@/shared/locales/signup";
import { useSignUp } from "@/application/auth/hooks/useSignUp";

export const SignUpFormMobile = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signUp, loading } = useSignUp();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await signUp({ email, password });
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
        <Spacer size="20px" />
        <SubmitButton type="submit" disabled={loading}>
          {loading ? signupTexts.signingUp : sharedTexts.signUp}
        </SubmitButton>
      </Form>
      <Spacer size="8px" />
      <PrivacyText />
    </MobileContainer>
  );
};
