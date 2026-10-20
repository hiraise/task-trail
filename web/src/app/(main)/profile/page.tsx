import { ProfileDesktopPage, ProfileMobilePage } from "@/presentation/features/user/pages";
import { DeviceBased } from "@/presentation/shared";

export default function ProfilePage() {
  return <DeviceBased desktop={<ProfileDesktopPage />} mobile={<ProfileMobilePage />} />;
}
