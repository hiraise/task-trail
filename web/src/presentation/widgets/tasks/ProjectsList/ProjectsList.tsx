"use client";

import { useState } from "react";

import styles from "./ProjectsList.module.css";

import { Project } from "@/domain/project/project.entity";
import { projectsTexts } from "@/shared/locales/projects";
import { Input } from "@/presentation/ui/Input/Input.styled";
import { ProjectItem } from "./ProjectItem";

interface ProjectsListProps {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export function ProjectsList({ projects, onSelect }: ProjectsListProps) {
  const [query, setQuery] = useState("");

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
            className={styles.projectItem}
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
