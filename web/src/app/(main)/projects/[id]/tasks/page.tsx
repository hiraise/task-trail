"use client";

import { useParams } from "next/navigation";

import type { ProjectId } from "@/domain/types";
import { ProjectTasksMobilePage } from "@/presentation/features/projects/pages";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { ROUTES } from "@/shared/config/routes";

/**
 * Mobile-only page. Always redirects desktop users to the project page.
 */

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params.id as ProjectId;

  return (
    <DeviceBased
      desktop={<RedirectScreen href={ROUTES.project(projectId)} />}
      mobile={<ProjectTasksMobilePage />}
    />
  );
}
