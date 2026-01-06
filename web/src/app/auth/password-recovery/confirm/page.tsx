import { ConfirmPasswordRecoveryMobilePage } from "@/presentation/features/auth/pages/PasswordRecoveryPage";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";

/**
 * Mobile-only page. Always redirects desktop users to the password recovery page.
 */

export default function ConfirmPasswordRecoveryPage() {
  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.passwordRecovery} />}
      mobile={<ConfirmPasswordRecoveryMobilePage />}
    />
  );
}
