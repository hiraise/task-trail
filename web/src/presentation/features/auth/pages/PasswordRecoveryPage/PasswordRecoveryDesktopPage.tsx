"use client";

import { authTexts } from "@/shared/locales/auth";

import { AuthBackground, TitleWrapper } from "../../components";
import { PasswordRecoveryFormDesktop } from "../../components/PasswordRecoveryForm";

export function PasswordRecoveryDesktopPage() {
  return (
    <AuthBackground>
      <TitleWrapper>
        <h1>{authTexts.passwordRecovery.title}</h1>
        <p className="body-reg" style={{ maxWidth: "510px" }}>
          {authTexts.passwordRecovery.description}
        </p>
      </TitleWrapper>
      <PasswordRecoveryFormDesktop />
    </AuthBackground>
  );
}
