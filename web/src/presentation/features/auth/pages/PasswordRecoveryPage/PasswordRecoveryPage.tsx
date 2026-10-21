import { DeviceBased } from "@/presentation/shared";

import { PasswordRecoveryDesktopPage } from "./PasswordRecoveryDesktopPage";
import { PasswordRecoveryMobilePage } from "./PasswordRecoveryMobilePage";

export function PasswordRecoveryPage() {
  return (
    <DeviceBased
      desktop={<PasswordRecoveryDesktopPage />}
      mobile={<PasswordRecoveryMobilePage />}
    />
  );
}
