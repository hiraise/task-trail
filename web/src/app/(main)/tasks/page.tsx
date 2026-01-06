"use client";

import { TasksDesktopPage, TasksMobilePage } from "@/presentation/features/tasks/pages";
import { DeviceBased, TabPanelProvider } from "@/presentation/shared";

export default function TasksPage() {
  return (
    <TabPanelProvider>
      <DeviceBased desktop={<TasksDesktopPage />} mobile={<TasksMobilePage />} />
    </TabPanelProvider>
  );
}
