"use client";

import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { TasksDesktopPage, TasksMobilePage } from "@/presentation/pages/tasks";
import { TabPanelProvider } from "@/presentation/widgets/tasks/TabPanel";

export default function TasksPage() {
  return (
    <TabPanelProvider>
      <DeviceBased desktop={<TasksDesktopPage />} mobile={<TasksMobilePage />} />
    </TabPanelProvider>
  );
}
