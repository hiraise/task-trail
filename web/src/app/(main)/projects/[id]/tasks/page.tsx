"use client";

import { useParams } from "next/navigation";

import { DeviceBased } from "@/presentation/ui/DeviceBased";
import RedirectScreen from "@/presentation/widgets/common/RedirectScreen";
import { ROUTES } from "@/infrastructure/config/routes";
import { ProjectTasksMobilePage } from "@/presentation/pages/projects";

/**
 * Mobile-only page. Always redirects desktop users to the project page.
 */

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = Number(params.id);

  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.project(projectId)} />}
      mobile={<ProjectTasksMobilePage />}
    />
  );
}
