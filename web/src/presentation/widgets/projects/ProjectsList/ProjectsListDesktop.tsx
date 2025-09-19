import Link from "next/link";

import styles from "./ProjectsListDesktop.module.css";

import { Project } from "@/domain/project/project.entity";
import { ProjectCard } from "../ProjectCard";
import { ROUTES } from "@/infrastructure/config/routes";
import { EmptyListState } from "../../common/EmptyListState/EmptyListState";
import { ASSETS } from "@/infrastructure/config/assets";
import { TEXTS } from "@/shared/locales/texts";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";

export function ProjectsListDesktop({ projects }: { projects: Project[] }) {
  const { showCreateProject } = useGlobalModals();

  if (projects.length === 0)
    return (
      <EmptyListState
        src={ASSETS.images.project}
        alt={TEXTS.projects.projectAlt}
        text={TEXTS.projects.empty}
        btnLabel={TEXTS.projects.createButton}
        onClick={showCreateProject}
      />
    );

  return (
    <div className={styles.cards}>
      {projects?.map((project) => (
        <Link key={project.id} href={ROUTES.project(project.id)}>
          <ProjectCard project={project} />
        </Link>
      ))}
    </div>
  );
}
