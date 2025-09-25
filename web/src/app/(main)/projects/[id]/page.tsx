"use client";

import { ProjectDesktopPage, ProjectMobilePage } from "@/presentation/pages/projects";
import { DeviceBased } from "@/presentation/ui/DeviceBased";

export default function ProjectPage() {
  return <DeviceBased desktop={<ProjectDesktopPage />} mobile={<ProjectMobilePage />} />;
}
