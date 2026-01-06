import { ContentTopBarDesktop, TabType, useTabPanel } from "@/presentation/shared";
import { TasksDesktopTemplate, TopBarDesktop } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectsListDesktop } from "../../components";
import { useProjects } from "../../hooks";

import styles from "./ProjectsDesktopPage.module.css";

export function ProjectsDesktopPage() {
  const { activeTab } = useTabPanel();
  const { showCreateProject } = useGlobalModals();
  const { showSortOptions } = useGlobalModals();

  const { data: projects } = useProjects();
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
