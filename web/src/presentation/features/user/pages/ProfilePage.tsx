import { DeviceBased } from "@/presentation/shared";
import { ProfileDesktopPage } from "./ProfilePage/ProfileDesktopPage";
import { ProfileMobilePage } from "./ProfilePage/ProfileMobilePage";

export function ProfilePage() {
  return <DeviceBased desktop={<ProfileDesktopPage />} mobile={<ProfileMobilePage />} />;
}
