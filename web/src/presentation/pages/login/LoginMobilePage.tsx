"use client";

import { ROUTES } from "@/infrastructure/config/routes";
import { MobileLogo } from "@/presentation/ui/MobileLogo";
import { LoginFormMobile } from "@/presentation/widgets/auth/LoginForm/LoginFormMobile";
import { BottomLinks } from "@/presentation/widgets/common/BottomLinks";
import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { authTexts } from "@/shared/locales/auth";

export function LoginMobilePage() {
  return (
    <MainContainer>
      <MobileLogo />
      <Spacer size="56px" />
      <SectionTitle title={authTexts.login.title} subtitle={authTexts.login.description} />
      <Spacer size="56px" />
      <LoginFormMobile />
      <Spacer size="92px" />
      <BottomLinks
        href={ROUTES.signUp}
        text={authTexts.noAccount}
        buttonText={authTexts.signup.signup}
      />
    </MainContainer>
  );
}
