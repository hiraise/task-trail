import { ContentTopBarMobile } from "@/presentation/shared";
import { PagesMobileTemplate, TopBarMobile } from "@/presentation/shared/components/Layout";
import { TabType } from "@/presentation/shared/components/TabPanel";
import { useTabPanel } from "@/presentation/shared/components/TabPanel/TabPanelContext";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectsList } from "../../components";
import { useProjects } from "../../hooks";

import styles from "./ProjectsMobilePage.module.css";

export function ProjectsMobilePage() {
  const { activeTab } = useTabPanel();
  const { showCreateProject, showSortOptions } = useGlobalModals();
  const { data: projects } = useProjects();

  if (!projects) return null;

  // TODO: Implement sorting logic

  const topBar = <TopBarMobile title={TEXTS.drawer.myProjects} onClick={showCreateProject} />;

  return (
    <PagesMobileTemplate topBar={topBar}>
      <div className={styles.container}>
        <ContentTopBarMobile onClick={showSortOptions} />
        {activeTab === TabType.ACTIVE && <ProjectsList projects={projects} variant="mobile" />}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </PagesMobileTemplate>
  );
}
