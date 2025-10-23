import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { SignupDesktopPage, SignupMobilePage } from "@/presentation/pages/signup";

export default function SignupPage() {
  return <DeviceBased desktop={<SignupDesktopPage />} mobile={<SignupMobilePage />} />;
}
