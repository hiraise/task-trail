import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { TasksDesktopPage, TasksMobilePage } from "@/presentation/pages/tasks";

export default function TasksPage() {
  return <DeviceBased desktop={<TasksDesktopPage />} mobile={<TasksMobilePage />} />;
}
