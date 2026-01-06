"use client";

import { ProjectsDesktopPage, ProjectsMobilePage } from "@/presentation/features/projects/pages";
import { DeviceBased, TabPanelProvider } from "@/presentation/shared";

export default function ProjectsPage() {
  return (
    <TabPanelProvider>
      <DeviceBased desktop={<ProjectsDesktopPage />} mobile={<ProjectsMobilePage />} />
    </TabPanelProvider>
  );
}
