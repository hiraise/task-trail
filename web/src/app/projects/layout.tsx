import { DesktopTemplate } from "@/presentation/templates/DesktopTemplate";
import { DeviceBased } from "@/presentation/ui/DeviceBased";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <DeviceBased mobile={children} desktop={<DesktopTemplate>{children}</DesktopTemplate>} />;
}
