"use client";

import { useState } from "react";

import styles from "./ProjectsList.module.css";

import { Project } from "@/domain/project/project.entity";
import { ProjectItem } from "./ProjectItem";
import { SearchField } from "../../common/SearchField";
import { TEXTS } from "@/shared/locales/texts";

interface ProjectsListProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  selectedProjectId?: number;
}

export function ProjectsList({ projects, onSelect, selectedProjectId }: ProjectsListProps) {
  const [query, setQuery] = useState("");

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      <SearchField
        id="query"
        type="text"
        placeholder={TEXTS.projects.titlePlaceholder}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        value={query}
      />

      <div className={styles.projectList}>
        {filteredProjects.map((project) => (
          <ProjectItem
            key={project.id}
            project={project}
            isSelected={project.id === selectedProjectId}
            onClick={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
