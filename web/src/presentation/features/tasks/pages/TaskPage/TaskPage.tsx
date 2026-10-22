import { useNavigate, useParams } from "@tanstack/react-router";
import { useEffect } from "react";

import type { TaskId } from "@/domain/types";
import { BackButton } from "@/presentation/shared";
import { TopBarBackMobile } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { hasErrorCode } from "@/shared/errors/types";
import { tasksTexts } from "@/shared/locales/tasks";
import { TEXTS } from "@/shared/locales/texts";

import { Comments, TaskInfo } from "../../components";
import { useTaskDetail, useTaskMenuItems } from "../../hooks";

import styles from "./TaskPage.module.css";

/**
 * Страница задачи — из «Моих задач» (`/tasks/$taskId`) и из проекта (`/projects/$id/tasks/$taskId`).
 * На телефоне — верхняя панель с меню задачи в нижней панели; с 768 px — карточки и меню «…»
 * у названия. Раскладку переключает CSS (ADR-0008).
 */
export function TaskPage({ taskId }: { taskId: TaskId }) {
  const { data, error } = useTaskDetail(taskId);
  const { menuItems } = useTaskMenuItems(data?.task);
  const { showTaskSettings } = useGlobalModals();

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
          <section className={styles.section}>
            <Comments />
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

    // Пока грузится — те же карточки пустыми: экран не пустеет и не прыгает
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
          title={TEXTS.projects.task}
          variant={data ? "menu" : "none"}
          onActionClick={() => data && showTaskSettings(data.task)}
        />
      </div>
      <BackButton className={styles.back} />
      <div className={styles.sections}>{renderSections()}</div>
    </div>
  );
}

/** Задачу перенесли в другой проект — адрес из проекта ведёт в новый проект. */
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
