import { useParams } from "@tanstack/react-router";

import { getUserDisplayName } from "@/domain/models/User";
import { BackButton } from "@/presentation/shared";
import { TopBarBackMobile } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { FloatingButton, ProjectInfo, ProjectMembers, ProjectTasks } from "../../components";
import { useProjectDetail, useProjectMenuItems } from "../../hooks";

import styles from "./ProjectPage.module.css";

/**
 * Страница проекта. На телефоне — верхняя панель с меню проекта в нижней панели и участники
 * ссылкой на свою страницу; с 768 px — карточки, меню «…» у названия и участники списком.
 * Раскладку переключает CSS (ADR-0008).
 */
export function ProjectPage() {
  const { id: projectId } = useParams({ from: "/_main/projects/$id/" });
  const { data } = useProjectDetail(projectId);
  const { menuItems } = useProjectMenuItems(projectId);
  const { showProjectSettings } = useGlobalModals();

  if (!data) return null;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <TopBarBackMobile
          title={TEXTS.projects.project}
          variant={menuItems.length > 0 ? "menu" : "none"}
          onActionClick={() => showProjectSettings(projectId)}
        />
      </div>
      <BackButton className={styles.back} />

      <div className={styles.sections}>
        <section className={styles.section}>
          <ProjectInfo
            project={data.project}
            owner={data.owner && getUserDisplayName(data.owner)}
            menuItems={menuItems}
          />
        </section>
        <section className={styles.section}>
          <ProjectMembers projectId={projectId} members={data.members} />
        </section>
        <section className={styles.section}>
          <ProjectTasks projectId={projectId} tasks={data.tasks} className={styles.tasks} />
        </section>
      </div>
      <FloatingButton />
    </div>
  );
}
