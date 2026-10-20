/**
 * Mobile-only page. Always redirects desktop users to the profile page.
 */

import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";

import { EditPersonalDataMobilePage } from "./SettingsPage";

export function EditPersonalDataPage() {
  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.profile} />}
      mobile={<EditPersonalDataMobilePage />}
    />
  );
}
