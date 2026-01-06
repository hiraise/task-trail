import { SignupDesktopPage, SignupMobilePage } from "@/presentation/features/auth/pages/SignUpPage";
import { DeviceBased } from "@/presentation/shared";

export default function SignupPage() {
  return <DeviceBased desktop={<SignupDesktopPage />} mobile={<SignupMobilePage />} />;
}
