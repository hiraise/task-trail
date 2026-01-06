import { TaskDesktopPage, TaskMobilePage } from "@/presentation/features/tasks/pages";
import { DeviceBased } from "@/presentation/shared";

export default function TaskPage() {
  return <DeviceBased desktop={<TaskDesktopPage />} mobile={<TaskMobilePage />} />;
}
