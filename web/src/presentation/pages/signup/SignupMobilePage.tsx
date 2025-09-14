"use client";

import { ROUTES } from "@/infrastructure/config/routes";
import { MobileLogo } from "@/presentation/ui/MobileLogo";
import { SignUpFormMobile } from "@/presentation/widgets/auth/SignUpForm/SignUpFormMobile";
import { BottomLinks } from "@/presentation/widgets/common/BottomLinks";
import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { signupTexts } from "@/shared/locales/signup";

export function SignupMobilePage() {
  return (
    <MainContainer>
      <MobileLogo />
      <Spacer size="56px" />
      <SectionTitle title={signupTexts.title} subtitle={signupTexts.subtitle} />
      <Spacer size="56px" />
      <SignUpFormMobile />
      <Spacer size="121px" />
      <BottomLinks
        href={ROUTES.login}
        text={signupTexts.hasAccount}
        buttonText={sharedTexts.login}
      />
    </MainContainer>
  );
}
