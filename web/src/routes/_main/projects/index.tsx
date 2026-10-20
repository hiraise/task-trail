import { createFileRoute } from "@tanstack/react-router";

import { ProjectsPage } from "@/presentation/features/projects/pages";

export const Route = createFileRoute("/_main/projects/")({
  component: ProjectsPage,
});
