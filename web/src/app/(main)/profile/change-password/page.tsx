import { DeviceBased } from "@/presentation/ui/DeviceBased";
import RedirectScreen from "@/presentation/widgets/common/RedirectScreen";
import { ChangePasswordMobilePage } from "@/presentation/pages/profile";
import { ROUTES } from "@/infrastructure/config/routes";

/**
 * Mobile-only page. Always redirects desktop users to the profile page.
 */

export default function ChangePasswordPage() {
  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.profile} />}
      mobile={<ChangePasswordMobilePage />}
    />
  );
}
