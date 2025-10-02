import { ROUTES } from "@/infrastructure/config/routes";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { EditPersonalDataMobilePage } from "@/presentation/pages/profile";
import RedirectScreen from "@/presentation/widgets/common/RedirectScreen";

/**
 * Mobile-only page. Always redirects desktop users to the profile page.
 */
export default function EditPersonalDataPage() {
  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.profile} />}
      mobile={<EditPersonalDataMobilePage />}
    />
  );
}
