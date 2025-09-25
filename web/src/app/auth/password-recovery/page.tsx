import { DeviceBased } from "@/presentation/ui/DeviceBased";
import {
  PasswordRecoveryDesktopPage,
  PasswordRecoveryMobilePage,
} from "@/presentation/pages/password-recovery";

export default function PasswordRecoveryPage() {
  return (
    <DeviceBased
      desktop={<PasswordRecoveryDesktopPage />}
      mobile={<PasswordRecoveryMobilePage />}
    />
  );
}
