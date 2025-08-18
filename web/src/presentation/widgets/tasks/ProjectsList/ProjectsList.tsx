"use client";

import { useState } from "react";
import clsx from "clsx";

import styles from "./ProjectsList.module.css";

import { Project } from "@/domain/project/project.entity";
import { projectsTexts } from "@/shared/locales/projects";
import { Input } from "@/presentation/ui/Input/Input.styled";
import { ProjectItem } from "./ProjectItem";
import { useModalProps } from "@/application/tasks/hooks/useModalProps";

interface ProjectsListProps {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export function ProjectsList({ projects, onSelect }: ProjectsListProps) {
  const [query, setQuery] = useState("");
  const { projectId } = useModalProps<{ projectId?: number }>() || {};

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      <Input
        id="query"
        type="text"
        placeholder={projectsTexts.projectNamePlaceholder}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.projectList}>
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className={clsx(styles.projectItem, project.id === projectId && styles.selected)}
            onClick={() => onSelect(project)}
            role="button"
          >
            <ProjectItem project={project} />
          </div>
        ))}
      </div>
    </div>
  );
}
