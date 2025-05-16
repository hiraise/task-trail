"use client";

import { loginTexts } from "@/shared/locales/login";
import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { BottomLinks } from "@/presentation/widgets/common/BottomLinks";
import { MobileLogo } from "@/presentation/ui/MobileLogo";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { ROUTES } from "@/infrastructure/config/routes";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { LoginForm } from "@/presentation/widgets/auth/LoginForm/LoginForm";

export default function LoginPage() {
  return (
    <MainContainer>
      <MobileLogo />
      <Spacer size="56px" />
      <SectionTitle title={loginTexts.title} subtitle={loginTexts.subtitle} />
      <Spacer size="56px" />
      <LoginForm />
      <Spacer size="92px" />
      <BottomLinks
        href={ROUTES.signUp}
        text={loginTexts.noAccount}
        buttonText={sharedTexts.signUp}
      />
    </MainContainer>
  );
}
