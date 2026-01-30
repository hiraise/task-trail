"use client";

import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

import { PersonalDataFormMobile } from "../../components";

export function EditPersonalDataMobilePage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.personalInfoTitle}>
      <PersonalDataFormMobile />
    </PagesMobileTemplate>
  );
}
