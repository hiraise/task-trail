/**
 * Mobile-only page. Always redirects desktop users to the password recovery page.
 */

import { ROUTES } from "@/infrastructure/config/routes";
import { ConfirmPasswordRecoveryMobilePage } from "@/presentation/pages/password-recovery";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import RedirectScreen from "@/presentation/widgets/common/RedirectScreen";

export default function ConfirmPasswordRecoveryPage() {
  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.passwordRecovery} />}
      mobile={<ConfirmPasswordRecoveryMobilePage />}
    />
  );
}
