import { useMemo } from "react";

import {
  ContentTopBarDesktop,
  ContentTopBarMobile,
  TabPanelProvider,
  TabType,
  useTabPanel,
} from "@/presentation/shared";
import { TopBarDesktop, TopBarMobile } from "@/presentation/shared/components/Layout";
import { useListSort } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";
import { sortItems } from "@/shared/utils/sortItems";

import { ProjectsList } from "../../components";
import { useProjects } from "../../hooks";

import styles from "./ProjectsPage.module.css";

/** "My projects" — active and archived projects of the current user (ADR-0027). */
export function ProjectsPage() {
  return (
    <TabPanelProvider>
      <ProjectsScreen />
    </TabPanelProvider>
  );
}

// On a phone — the top bar and phone tabs; from 768 px — a header with a button and a card
// (ADR-0008): both are in the markup, one is visible depending on the screen width.
function ProjectsScreen() {
  const { activeTab } = useTabPanel();
  const archived = activeTab === TabType.ARCHIVED;
  const { showCreateProject } = useGlobalModals();
  const { sort, openSort } = useListSort("projects");
  const { data: projects } = useProjects(archived);

  const sorted = useMemo(() => projects && sortItems(projects, sort), [projects, sort]);

  return (
    <div className={styles.page}>
      <div className={styles.phoneTopBar}>
        <TopBarMobile title={TEXTS.drawer.myProjects} onClick={showCreateProject} />
      </div>
      <div className={styles.wideTopBar}>
        <TopBarDesktop
          title={TEXTS.drawer.myProjects}
          buttonText={TEXTS.projects.createButton}
          onClick={showCreateProject}
        />
      </div>
      <div className={styles.content}>
        <div className={styles.phoneOnly}>
          <ContentTopBarMobile onClick={openSort} />
        </div>
        <div className={styles.wideOnly}>
          <ContentTopBarDesktop onClick={openSort} />
        </div>
        {sorted && <ProjectsList projects={sorted} archived={archived} />}
      </div>
    </div>
  );
}
