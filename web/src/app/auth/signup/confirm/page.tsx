/**
 * Mobile-only page. Always redirects desktop users to the signup page.
 */

import { ROUTES } from "@/infrastructure/config/routes";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { ConfirmSignupMobilePage } from "@/presentation/pages/signup";
import RedirectScreen from "@/presentation/widgets/common/RedirectScreen";

export default function ConfirmSignupPage() {
  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.signUp} />}
      mobile={<ConfirmSignupMobilePage />}
    />
  );
}
