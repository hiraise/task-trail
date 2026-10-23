import { Link } from "@tanstack/react-router";

import type { Project } from "@/domain/models/Project";
import { EmptyListState } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ASSETS } from "@/shared/config/assets";
import { projectsTexts } from "@/shared/locales/projects";
import { TEXTS } from "@/shared/locales/texts";

import { ProjectCard } from "../ProjectCard";

import styles from "./ProjectsList.module.css";

interface ProjectsListProps {
  projects: Project[];
  /** The Archived tab: its empty state has no "Create project" button */
  archived?: boolean;
}

export function ProjectsList({ projects, archived = false }: ProjectsListProps) {
  const { showCreateProject } = useGlobalModals();

  if (projects.length === 0) {
    return archived ? (
      <EmptyListState
        src={ASSETS.images.project}
        alt={TEXTS.projects.projectAlt}
        text={projectsTexts.emptyArchive}
      />
    ) : (
      <EmptyListState
        src={ASSETS.images.project}
        alt={TEXTS.projects.projectAlt}
        text={TEXTS.projects.empty}
        btnLabel={TEXTS.projects.createButton}
        onClick={showCreateProject}
      />
    );
  }

  return (
    <div className={styles.cards}>
      {projects.map((project) => (
        <Link key={project.id} to={"/projects/$id"} params={{ id: project.id }}>
          <ProjectCard project={project} />
        </Link>
      ))}
    </div>
  );
}
