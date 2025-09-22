import Link from "next/link";

import styles from "./ProjectsMobilePage.module.css";

import { useGet } from "@/application/projects/hooks/useProject";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { ProjectCard } from "@/presentation/widgets/projects/ProjectCard";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { ROUTES } from "@/infrastructure/config/routes";
import { TEXTS } from "@/shared/locales/texts";

export function ProjectsMobilePage() {
  const { showCreateProject, showSortOptions } = useGlobalModals();
  const { data: projects } = useGet();

  if (!projects) return null;

  // TODO: Implement sorting logic
  const handleSortProjects = async () => {
    const option = await showSortOptions();
    console.log("Selected sort option:", option);
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <div className={styles.titleWrapper}>
        <h1>{TEXTS.drawer.myProjects}</h1>
        <IconButton icon={ICONS.sort} onClick={handleSortProjects} />
      </div>
      <div className={styles.cards}>
        {projects?.map((project) => (
          <Link key={project.id} href={ROUTES.project(project.id)}>
            <ProjectCard project={project} />
          </Link>
        ))}
      </div>
      <FloatingButton onClick={showCreateProject} variant="withBottomNav" />
      <BottomNavBar />
    </MainContainer>
  );
}
