"use client";

import { TabPanelProvider } from "@/presentation/widgets/tasks/TabPanel";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { ProjectsDesktopPage, ProjectsMobilePage } from "@/presentation/pages/projects";

export default function ProjectsPage() {
  return (
    <TabPanelProvider>
      <DeviceBased desktop={<ProjectsDesktopPage />} mobile={<ProjectsMobilePage />} />
    </TabPanelProvider>
  );
}
