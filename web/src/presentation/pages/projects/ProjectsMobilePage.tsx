import styles from "./ProjectsMobilePage.module.css";

import { useGet } from "@/application/projects/hooks/useProject";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";
import { TopBarMobile } from "@/presentation/widgets/common/TopBar/TopBarMobile";
import { PagesMobileTemplate } from "@/presentation/templates";
import { ProjectsListMobile } from "@/presentation/widgets/projects/ProjectsList";
import { useTabPanel } from "@/presentation/widgets/tasks/TabPanel/TabPanelContext";
import { ContentTopBarMobile } from "@/presentation/widgets/common/ContentTopBar";
import { TabType } from "@/presentation/widgets/tasks/TabPanel";

export function ProjectsMobilePage() {
  const { activeTab } = useTabPanel();
  const { showCreateProject, showSortOptions } = useGlobalModals();
  const { data: projects } = useGet();

  if (!projects) return null;

  // TODO: Implement sorting logic

  const topBar = <TopBarMobile title={TEXTS.drawer.myProjects} onClick={showCreateProject} />;

  return (
    <PagesMobileTemplate topBar={topBar}>
      <div className={styles.container}>
        <ContentTopBarMobile onClick={showSortOptions} />
        {activeTab === TabType.ACTIVE && <ProjectsListMobile projects={projects} />}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </PagesMobileTemplate>
  );
}
