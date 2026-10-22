import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

import { PersonalDataForm } from "../components";

/** Personal data as a separate page, from a phone; on a desktop the same form is in the profile. */
export function EditPersonalDataPage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.personalInfoTitle}>
      <PersonalDataForm layout="page" />
    </PagesMobileTemplate>
  );
}
