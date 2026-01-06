"use client";

import { ChangePasswordFormMobile } from "@/presentation/features/user/components";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

export function ChangePasswordMobilePage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.changePassword2}>
      <ChangePasswordFormMobile />
    </PagesMobileTemplate>
  );
}
