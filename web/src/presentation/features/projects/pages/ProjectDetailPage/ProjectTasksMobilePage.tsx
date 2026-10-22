import { useParams } from "@tanstack/react-router";

import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useProjectMembers, useProjectTasks } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { FloatingButton, TaskList } from "../../components";

export function ProjectTasksMobilePage() {
  const { id: projectId } = useParams({ from: "/_main/projects/$id/tasks/" });

  const { showSortOptions } = useGlobalModals();
  const { data: tasks } = useProjectTasks(projectId);
  const { data: members = [] } = useProjectMembers(projectId);

  if (!tasks) return null;

  return (
    <>
      <PagesMobileTemplate
        topBarBackTitle={TEXTS.projects.tasks}
        variant="sort"
        onActionClick={showSortOptions}
      >
        <TaskList tasks={tasks} members={members} />
      </PagesMobileTemplate>
      <FloatingButton projectId={projectId} />
    </>
  );
}
