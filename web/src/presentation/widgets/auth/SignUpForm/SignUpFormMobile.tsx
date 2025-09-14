"use client";

import { FormEvent, useState } from "react";

import { Spacer } from "../../primitives/Spacer";
import { MobileContainer } from "../../primitives/MobileContainer";
import { Form } from "../LoginForm/LoginFormMobile.styled";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { useSignUp } from "@/application/auth/hooks/useSignUp";
import { PrivacyPolicyMobile } from "../PrivacyPolicyText";
import { AuthFormFieldsMobile } from "../AuthFormFields";
import { authTexts } from "@/shared/locales/auth";

export const SignupFormMobile = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutateAsync: signUp, isPending: loading } = useSignUp();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await signUp({ email, password });
  };

  return (
    <MobileContainer>
      <Form onSubmit={handleSubmit}>
        <AuthFormFieldsMobile
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
        <Spacer size="20px" />
        <SubmitButton type="submit" disabled={loading}>
          {loading ? authTexts.signup.signingUp : authTexts.signup.signup}
        </SubmitButton>
      </Form>
      <Spacer size="8px" />
      <PrivacyPolicyMobile btnName={authTexts.login.login} />
    </MobileContainer>
  );
};
