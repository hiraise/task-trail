import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { DesktopTemplate } from "@/presentation/templates/DesktopTemplate";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <DeviceBased mobile={children} desktop={<DesktopTemplate>{children}</DesktopTemplate>} />;
}
