"use client";

import { ROUTES } from "@/infrastructure/config/routes";
import { MobileLogo } from "@/presentation/ui/MobileLogo";
import { SignupFormMobile } from "@/presentation/widgets/auth/SignUpForm";
import { BottomLinks } from "@/presentation/widgets/common/BottomLinks";
import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { authTexts } from "@/shared/locales/auth";

export function SignupMobilePage() {
  return (
    <MainContainer>
      <MobileLogo />
      <Spacer size="56px" />
      <SectionTitle title={authTexts.signup.title} subtitle={authTexts.signup.description} />
      <Spacer size="56px" />
      <SignupFormMobile />
      <Spacer size="121px" />
      <BottomLinks
        href={ROUTES.login}
        text={authTexts.hasAccount}
        buttonText={authTexts.login.login}
      />
    </MainContainer>
  );
}
