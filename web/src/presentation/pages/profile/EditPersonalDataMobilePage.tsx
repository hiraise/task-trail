"use client";

import { TEXTS } from "@/shared/locales/texts";
import { PagesMobileTemplate } from "@/presentation/templates";
import { PersonalDataFormMobile } from "@/presentation/widgets/profile/PersonalDataForm";

export function EditPersonalDataMobilePage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.personalInfoTitle}>
      <PersonalDataFormMobile />
    </PagesMobileTemplate>
  );
}
