"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { LoginFields } from "../../common/LoginFields";
import { PrivacyText } from "../../common/PrivacyText";
import { Spacer } from "../../primitives/Spacer";
import { MobileContainer } from "../../primitives/MobileContainer";
import { Form } from "../LoginForm/LoginForm.styled";
import { SubmitButton } from "@/presentation/ui/SubmitButton";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { ROUTES } from "@/infrastructure/config/routes";
import { useSignUp } from "@/application/auth/hooks/useSignUp";
import { toastSignUp } from "@/shared/lib/toastSignUp";

export const SignUpFormMobile = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signUp, loading } = useSignUp();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    //TODO: add signup logic
    try {
      await toastSignUp(() => signUp(email, password));
      router.push(ROUTES.dashboard);
    } catch (error) {
      console.error("Registration failed:", error);
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
        <Spacer size="20px" />
        <SubmitButton type="submit" disabled={loading}>
          {/* TODO: move text to constants */}
          {loading ? "Регистрация..." : sharedTexts.signUp}
        </SubmitButton>
      </Form>
      <Spacer size="8px" />
      <PrivacyText />
    </MobileContainer>
  );
};
