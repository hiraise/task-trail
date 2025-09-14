"use client";

import { AuthBackground, TitleWrapper } from "@/presentation/widgets/auth/_components";
import { PasswordRecoveryFormDesktop } from "@/presentation/widgets/auth/PasswordRecoveryForm";
import { authTexts } from "@/shared/locales/auth";

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
