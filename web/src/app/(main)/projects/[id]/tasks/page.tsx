"use client";

import { useParams } from "next/navigation";

import { ProjectTasksMobilePage } from "@/presentation/features/projects/pages";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";

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
