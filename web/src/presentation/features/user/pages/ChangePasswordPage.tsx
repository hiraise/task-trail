import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

import { ChangePasswordForm } from "../components";

/** Смена пароля отдельной страницей — с телефона; на десктопе та же форма стоит в профиле. */
export function ChangePasswordPage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.changePassword2}>
      <ChangePasswordForm layout="page" />
    </PagesMobileTemplate>
  );
}
