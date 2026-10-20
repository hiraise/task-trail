/**
 * Mobile-only page. Always redirects desktop users to the project page.
 */

import { useParams } from "@tanstack/react-router";

import type { ProjectId } from "@/domain/types";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";

import { ProjectTasksMobilePage } from "./ProjectDetailPage";

export function ProjectTasksPage() {
  const { id } = useParams({ from: "/_main/projects/$id/tasks/" });
  const projectId = id as ProjectId;

  return (
    <DeviceBased
      desktop={<RedirectScreen href={`/projects/${projectId}`} />}
      mobile={<ProjectTasksMobilePage />}
    />
  );
}
