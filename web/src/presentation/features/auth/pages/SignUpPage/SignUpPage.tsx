import { DeviceBased } from "@/presentation/shared";

import { SignupDesktopPage } from "./SignupDesktopPage";
import { SignupMobilePage } from "./SignupMobilePage";

export function SignupPage() {
  return <DeviceBased desktop={<SignupDesktopPage />} mobile={<SignupMobilePage />} />;
}
