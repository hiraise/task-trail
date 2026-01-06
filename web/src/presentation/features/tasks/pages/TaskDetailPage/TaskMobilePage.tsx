"use client";

import { useParams } from "next/navigation";

import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { Comments, TaskInfoMobile } from "../../components";
import { useGetTask } from "../../hooks";

export function TaskMobilePage() {
  const params = useParams();
  const { showTaskSettings } = useGlobalModals();
  const { data: task } = useGetTask(params.taskId?.toString());

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
