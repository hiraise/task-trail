"use client";

import { useParams } from "next/navigation";

import type { TaskId } from "@/domain/types";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { Comments, TaskInfoMobile } from "../../components";
import { useGetTaskDetail } from "../../hooks/useGetTaskDetail";

export function TaskMobilePage() {
  const params = useParams();
  const { showTaskSettings } = useGlobalModals();
  const { data } = useGetTaskDetail(params.taskId as TaskId);

  if (!data) return null;

  return (
    <PagesMobileTemplate
      topBarBackTitle={TEXTS.projects.task}
      variant="menu"
      onActionClick={() => showTaskSettings(data.task)}
    >
      <TaskInfoMobile task={data.task} />
      <Comments />
    </PagesMobileTemplate>
  );
}
