import Link from "next/link";

import type { Project } from "@/domain/models/Project";
import { EmptyListState } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ASSETS } from "@/shared/config/assets";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectCard } from "../ProjectCard";

import styles from "./ProjectsListDesktop.module.css";

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
