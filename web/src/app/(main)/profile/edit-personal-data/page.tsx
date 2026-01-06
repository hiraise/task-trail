import { EditPersonalDataMobilePage } from "@/presentation/features/user/pages";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";

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
