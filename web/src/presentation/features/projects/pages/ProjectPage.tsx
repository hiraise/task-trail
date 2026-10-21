import { DeviceBased } from "@/presentation/shared";

import { ProjectDesktopPage, ProjectMobilePage } from "./ProjectDetailPage";

export function ProjectPage() {
  return <DeviceBased desktop={<ProjectDesktopPage />} mobile={<ProjectMobilePage />} />;
}
