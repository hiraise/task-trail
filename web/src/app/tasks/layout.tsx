import { TasksDesktopTemplate } from "@/presentation/templates";
import { DeviceBased } from "@/presentation/ui/DeviceBased";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceBased
      mobile={children}
      desktop={<TasksDesktopTemplate>{children}</TasksDesktopTemplate>}
    />
  );
}
