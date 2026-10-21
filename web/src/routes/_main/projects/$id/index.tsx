import { createFileRoute } from "@tanstack/react-router";

import { ProjectPage } from "@/presentation/features/projects/pages";

export const Route = createFileRoute("/_main/projects/$id/")({
  component: ProjectPage,
});
