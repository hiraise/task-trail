import styles from "./ProjectsDesktopPage.module.css";

import { TasksDesktopTemplate } from "@/presentation/templates";
import { TopBarDesktop } from "@/presentation/widgets/common/TopBar";
import { useTabPanel } from "@/presentation/widgets/tasks/TabPanel/TabPanelContext";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useGet } from "@/application/projects/hooks/useProject";
import { TEXTS } from "@/shared/locales/texts";
import { ProjectsListDesktop } from "@/presentation/widgets/projects/ProjectsList";
import { ContentTopBarDesktop } from "@/presentation/widgets/common/ContentTopBar";
import { TabType } from "@/presentation/widgets/tasks/TabPanel";

export function ProjectsDesktopPage() {
  const { activeTab } = useTabPanel();
  const { showCreateProject } = useGlobalModals();
  const { showSortOptions } = useGlobalModals();

  const { data: projects } = useGet();
  if (!projects) return null;

  const topBar = (
    <TopBarDesktop
      title={TEXTS.drawer.myProjects}
      buttonText={TEXTS.projects.createButton}
      onClick={showCreateProject}
    />
  );
  //TODO: implement archived tasks UI

  return (
    <TasksDesktopTemplate topBar={topBar}>
      <div className={styles.container}>
        <ContentTopBarDesktop onClick={showSortOptions} />
        {activeTab === TabType.ACTIVE && <ProjectsListDesktop projects={projects} />}
        {activeTab === TabType.ARCHIVED && <h1>Архив</h1>}
      </div>
    </TasksDesktopTemplate>
  );
}
