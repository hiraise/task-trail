"use client";

import { ROUTES } from "@/infrastructure/config/routes";
import { MobileLogo } from "@/presentation/ui/MobileLogo";
import { LoginFormMobile } from "@/presentation/widgets/auth/LoginForm/LoginFormMobile";
import { BottomLinks } from "@/presentation/widgets/common/BottomLinks";
import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { loginTexts } from "@/shared/locales/login";
import { sharedTexts } from "@/shared/locales/sharedTexts";

export function LoginMobilePage() {
  return (
    <MainContainer>
      <MobileLogo />
      <Spacer size="56px" />
      <SectionTitle title={loginTexts.title} subtitle={loginTexts.subtitle} />
      <Spacer size="56px" />
      <LoginFormMobile />
      <Spacer size="92px" />
      <BottomLinks
        href={ROUTES.signUp}
        text={loginTexts.noAccount}
        buttonText={sharedTexts.signUp}
      />
    </MainContainer>
  );
}
