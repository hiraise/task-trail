import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { Comments, TaskInfoMobile } from "../../components";
import type { Task } from "@/domain/models/Task";

export function TaskMobilePage({ task }: { task: Task }) {
  const { showTaskSettings } = useGlobalModals();

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
