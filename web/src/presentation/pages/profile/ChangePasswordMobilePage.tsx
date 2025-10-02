"use client";

import { TEXTS } from "@/shared/locales/texts";
import { PagesMobileTemplate } from "@/presentation/templates";
import { ChangePasswordFormMobile } from "@/presentation/widgets/profile/ChangePasswordForm";

export function ChangePasswordMobilePage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.changePassword2}>
      <ChangePasswordFormMobile />
    </PagesMobileTemplate>
  );
}
