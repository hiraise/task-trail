"use client";

import { useParams } from "next/navigation";

import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useGetProjectTasks } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { FloatingButtonDesktop, TaskList } from "../../components";

export function ProjectTasksMobilePage() {
  const params = useParams();
  const projectId = Number(params.id);

  const { showSortOptions } = useGlobalModals();
  const { data: tasks } = useGetProjectTasks(projectId);

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
