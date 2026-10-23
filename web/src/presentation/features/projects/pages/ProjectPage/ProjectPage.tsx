import { useParams } from "@tanstack/react-router";

import { isProjectArchived } from "@/domain/models/Project";
import { getUserDisplayName } from "@/domain/models/User";
import { BackButton } from "@/presentation/shared";
import { TopBarBackMobile } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { FloatingButton, ProjectInfo, ProjectMembers, ProjectTasks } from "../../components";
import { useProjectDetail, useProjectMenuItems } from "../../hooks";

import styles from "./ProjectPage.module.css";

/**
 * Project page. On a phone — a top bar with the project menu in a bottom sheet and members as
 * a link to their own page; from 768 px — cards, a "…" menu next to the name and a member list.
 * CSS switches the layout (ADR-0008). An archived project is read-only: no "Create task" (ADR-0027).
 */
export function ProjectPage() {
  const { id: projectId } = useParams({ from: "/_main/projects/$id/" });
  const { data } = useProjectDetail(projectId);
  const { menuItems } = useProjectMenuItems(projectId);
  const { showProjectSettings } = useGlobalModals();
  const archived = data ? isProjectArchived(data.project) : false;

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

      {data ? (
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
            <ProjectTasks
              projectId={projectId}
              members={data.members}
              projectArchived={archived}
              className={styles.tasks}
            />
          </section>
        </div>
      ) : (
        // While loading — empty cards: the screen does not go blank or jump
        <div className={styles.sections} aria-busy="true">
          <section className={styles.section} />
          <section className={styles.section} />
        </div>
      )}
      {data && !archived && <FloatingButton projectId={projectId} />}
    </div>
  );
}
