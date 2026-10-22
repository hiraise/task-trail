import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { TEXTS } from "@/shared/locales/texts";

import { ChangePasswordForm } from "../components";

/** Password change as a separate page, from a phone; on a desktop the same form is in the profile. */
export function ChangePasswordPage() {
  return (
    <PagesMobileTemplate topBarBackTitle={TEXTS.profile.changePassword2}>
      <ChangePasswordForm layout="page" />
    </PagesMobileTemplate>
  );
}
