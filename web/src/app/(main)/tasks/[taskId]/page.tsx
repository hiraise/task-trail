import { TaskDesktopPage, TaskMobilePage } from "@/presentation/pages/tasks";
import { DeviceBased } from "@/presentation/ui/DeviceBased";

export default function TaskPage() {
  return <DeviceBased desktop={<TaskDesktopPage />} mobile={<TaskMobilePage />} />;
}
