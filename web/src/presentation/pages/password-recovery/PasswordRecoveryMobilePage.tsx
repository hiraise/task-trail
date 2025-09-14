"use client";

import { MobileLogo } from "@/presentation/ui/MobileLogo";
import { PasswordRecoveryFormMobile } from "@/presentation/widgets/auth/PasswordRecoveryForm";
import { SectionTitle } from "@/presentation/widgets/common/SectionTitle";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { Spacer } from "@/presentation/widgets/primitives/Spacer";
import { authTexts } from "@/shared/locales/auth";

export function PasswordRecoveryMobilePage() {
  return (
    <MainContainer>
      <MobileLogo />
      <Spacer size="56px" />
      <SectionTitle
        title={authTexts.passwordRecovery.title}
        subtitle={authTexts.passwordRecovery.description}
      />
      <Spacer size="56px" />
      <PasswordRecoveryFormMobile />
    </MainContainer>
  );
}
