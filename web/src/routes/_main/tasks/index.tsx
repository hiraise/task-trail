import { createFileRoute } from "@tanstack/react-router";

import { TasksPage } from "@/presentation/features/tasks/pages";

export const Route = createFileRoute("/_main/tasks/")({
  component: TasksPage,
});
