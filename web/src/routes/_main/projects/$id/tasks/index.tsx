import { createFileRoute } from "@tanstack/react-router";

import { ProjectTasksPage } from "@/presentation/features/projects/pages";

export const Route = createFileRoute("/_main/projects/$id/tasks/")({
  component: ProjectTasksPage,
});
