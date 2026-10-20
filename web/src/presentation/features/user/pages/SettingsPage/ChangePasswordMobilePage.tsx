"use client";

import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

import { ChangePasswordFormMobile } from "../../components";

export function ChangePasswordMobilePage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.changePassword2}>
      <ChangePasswordFormMobile />
    </PagesMobileTemplate>
  );
}
