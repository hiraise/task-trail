import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

import { PersonalDataForm } from "../components";

/** Личные данные отдельной страницей — с телефона; на десктопе та же форма стоит в профиле. */
export function EditPersonalDataPage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.personalInfoTitle}>
      <PersonalDataForm layout="page" />
    </PagesMobileTemplate>
  );
}
