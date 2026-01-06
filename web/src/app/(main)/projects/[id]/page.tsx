"use client";

import { ProjectDesktopPage, ProjectMobilePage } from "@/presentation/features/projects/pages";
import { DeviceBased } from "@/presentation/shared";

export default function ProjectPage() {
  return <DeviceBased desktop={<ProjectDesktopPage />} mobile={<ProjectMobilePage />} />;
}
