"use client";

import { TEXTS } from "@/shared/locales/texts";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useGetTasks } from "@/application/projects/hooks/useProject";
import { PagesMobileTemplate } from "@/presentation/templates";
import { TaskList } from "@/presentation/widgets/projects/ProjectTask";
import { FloatingButtonDesktop } from "@/presentation/widgets/projects/FloatingButton";

export function ProjectTasksMobilePage() {
  const { showSortOptions } = useGlobalModals();
  const { data: tasks } = useGetTasks();

  if (!tasks) return null;

  return (
    <>
      <PagesMobileTemplate
        topBarBackTitle={TEXTS.projects.tasks}
        variant="sort"
        onActionClick={showSortOptions}
      >
        <TaskList tasks={tasks} />
      </PagesMobileTemplate>
      <FloatingButtonDesktop />
    </>
  );
}
