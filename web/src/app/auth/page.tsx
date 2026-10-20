import { LoginDesktopPage, LoginMobilePage } from "@/presentation/features/auth/pages";
import { DeviceBased } from "@/presentation/shared";

export default function LoginPage() {
  return <DeviceBased desktop={<LoginDesktopPage />} mobile={<LoginMobilePage />} />;
}
