"use client";

import { useGetTask } from "@/application/tasks/hooks/useTasks";
import { PagesMobileTemplate } from "@/presentation/templates";
import { Comments } from "@/presentation/widgets/tasks/Comments";
import { TaskInfoMobile } from "@/presentation/widgets/tasks/TaskInfo";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

export function TaskMobilePage() {
  const { showTaskSettings } = useGlobalModals();
  const { data: task } = useGetTask();

  if (!task) return null;

  return (
    <PagesMobileTemplate
      topBarBackTitle={TEXTS.projects.task}
      variant="menu"
      onActionClick={() => showTaskSettings(task)}
    >
      <TaskInfoMobile task={task} />
      <Comments />
    </PagesMobileTemplate>
  );
}
