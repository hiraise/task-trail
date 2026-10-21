import { DeviceBased, TabPanelProvider } from "@/presentation/shared";

import { TasksDesktopPage } from "./TasksPage/TasksDesktopPage";
import { TasksMobilePage } from "./TasksPage/TasksMobilePage";

export function TasksPage() {
  return (
    <TabPanelProvider>
      <DeviceBased desktop={<TasksDesktopPage />} mobile={<TasksMobilePage />} />
    </TabPanelProvider>
  );
}
