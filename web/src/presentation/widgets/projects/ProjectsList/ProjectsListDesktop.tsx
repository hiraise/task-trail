import Link from "next/link";

import styles from "./ProjectsListDesktop.module.css";

import { Project } from "@/domain/project/project.entity";
import { ProjectCard } from "../ProjectCard";
import { ROUTES } from "@/infrastructure/config/routes";

export function ProjectsListDesktop({ projects }: { projects: Project[] }) {
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
