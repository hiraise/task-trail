import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { ProfileDesktopPage, ProfileMobilePage } from "@/presentation/pages/profile";

export default function ProfilePage() {
  return <DeviceBased desktop={<ProfileDesktopPage />} mobile={<ProfileMobilePage />} />;
}
