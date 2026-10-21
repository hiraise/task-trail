import { DeviceBased, TabPanelProvider } from "@/presentation/shared";

import { ProjectsDesktopPage } from "./ProjectsPage/ProjectsDesktopPage";
import { ProjectsMobilePage } from "./ProjectsPage/ProjectsMobilePage";

export function ProjectsPage() {
  return (
    <TabPanelProvider>
      <DeviceBased desktop={<ProjectsDesktopPage />} mobile={<ProjectsMobilePage />} />
    </TabPanelProvider>
  );
}
