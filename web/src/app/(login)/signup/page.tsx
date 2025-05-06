"use client";

import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { MobileLogo } from "@/presentation/ui/MobileLogo";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import { signupTexts } from "@/shared/locales/signup";
import { sharedTexts } from "@/shared/locales/sharedTexts";
import { ROUTES } from "@/infrastructure/config/routes";
import { BottomLinks } from "@/presentation/widgets/common/BottomLinks";
import { SignUpFormMobile } from "@/presentation/widgets/auth/SignUpForm/SignUpFormMobile";

export default function SignUpPage() {
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
