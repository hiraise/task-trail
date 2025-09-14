import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { LoginDesktopPage, LoginMobilePage } from "@/presentation/pages/login";

export default function LoginPage() {
  return <DeviceBased desktop={<LoginDesktopPage />} mobile={<LoginMobilePage />} />;
}
