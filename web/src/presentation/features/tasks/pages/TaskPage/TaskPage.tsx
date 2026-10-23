import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

import { isTaskArchived } from "@/domain/models/Task";
import type { TaskId } from "@/domain/types";
import { BackButton } from "@/presentation/shared";
import { TopBarBackMobile } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { hasErrorCode } from "@/shared/errors/types";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";

import { TaskActivity, TaskInfo, TaskSubtasks } from "../../components";
import { useTaskDetail, useTaskMenuItems } from "../../hooks";

import styles from "./TaskPage.module.css";

/**
 * Task page — from "My tasks" (`/tasks/$taskId`) and from a project (`/projects/$id/tasks/$taskId`).
 * On a phone — a top bar with the task menu in a bottom sheet; from 768 px — cards and a "…" menu
 * next to the name. CSS switches the layout (ADR-0008).
 */
export function TaskPage({ taskId }: { taskId: TaskId }) {
  const { data, error } = useTaskDetail(taskId);
  const { menuItems } = useTaskMenuItems(data?.task);
  const { showTaskSettings } = useGlobalModals();
  const archived = data ? isTaskArchived(data.task) : false;

  useProjectInPath(data?.task.projectId, taskId);

  const renderSections = () => {
    if (data) {
      return (
        <>
          <section className={styles.section}>
            <TaskInfo
              task={data.task}
              project={data.project}
              status={data.status}
              assignee={data.assignee}
              menuItems={menuItems}
            />
          </section>
          <TaskSubtasks task={data.task} readOnly={archived} className={styles.section} />
          <section className={styles.section}>
            <TaskActivity task={data.task} role={data.project.role} />
          </section>
        </>
      );
    }

    if (error) {
      return (
        <section className={styles.section} role="status">
          <p className="body-reg-2">
            {hasErrorCode(error, "NOT_FOUND") ? tasksTexts.notFound : tasksTexts.loadFailed}
          </p>
        </section>
      );
    }

    // While loading — the same cards, empty: the screen does not go blank or jump
    return (
      <>
        <section className={styles.section} aria-busy="true" />
        <section className={styles.section} aria-busy="true" />
      </>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <TopBarBackMobile
          title={archived ? tasksTexts.archivedTask : TEXTS.projects.task}
          variant={menuItems.length > 0 ? "menu" : "none"}
          onActionClick={() => data && showTaskSettings(data.task)}
        />
      </div>
      <BackButton className={styles.back} />
      <div className={styles.sections}>{renderSections()}</div>
    </div>
  );
}

/** The task moved to another project — the project-based URL leads to the new project. */
function useProjectInPath(projectId: string | undefined, taskId: TaskId) {
  const navigate = useNavigate();
  const { id: pathProjectId } = useParams({ strict: false });

  useEffect(() => {
    if (projectId && pathProjectId && pathProjectId !== projectId) {
      navigate({
        to: "/projects/$id/tasks/$taskId",
        params: { id: projectId, taskId },
        replace: true,
      });
    }
  }, [projectId, pathProjectId, taskId, navigate]);
}
