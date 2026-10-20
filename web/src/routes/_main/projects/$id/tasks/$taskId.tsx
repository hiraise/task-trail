import { createFileRoute } from "@tanstack/react-router";

import type { TaskId } from "@/domain/types";
import { TaskPage } from "@/presentation/features/tasks/pages";

export const Route = createFileRoute("/_main/projects/$id/tasks/$taskId")({
  component: TaskPageRoute,
});

// eslint-disable-next-line react-refresh/only-export-components
function TaskPageRoute() {
  const { taskId } = Route.useParams();

  return <TaskPage taskId={taskId as TaskId} />;
}
