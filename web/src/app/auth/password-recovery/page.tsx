import {
  PasswordRecoveryDesktopPage,
  PasswordRecoveryMobilePage,
} from "@/presentation/features/auth/pages/PasswordRecoveryPage";
import { DeviceBased } from "@/presentation/shared";

export default function PasswordRecoveryPage() {
  return (
    <DeviceBased
      desktop={<PasswordRecoveryDesktopPage />}
      mobile={<PasswordRecoveryMobilePage />}
    />
  );
}
