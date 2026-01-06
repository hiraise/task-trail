import { ConfirmSignupMobilePage } from "@/presentation/features/auth/pages/SignUpPage";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";

/**
 * Mobile-only page. Always redirects desktop users to the signup page.
 */

export default function ConfirmSignupPage() {
  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.signUp} />}
      mobile={<ConfirmSignupMobilePage />}
    />
  );
}
