"use client";

import { PersonalDataFormMobile } from "@/presentation/features/user/components";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

export function EditPersonalDataMobilePage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.personalInfoTitle}>
      <PersonalDataFormMobile />
    </PagesMobileTemplate>
  );
}
