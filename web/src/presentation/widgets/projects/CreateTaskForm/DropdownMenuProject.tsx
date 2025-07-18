import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/presentation/ui/DropdownMenu";
import styles from "./DropdownMenu.module.css";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { Project } from "@/domain/project/project.entity";
import { useAppSelector } from "@/infrastructure/redux/hooks";

interface DropdownMenuProjectProps {
  onSelect: (value: string) => void;
}

export function DropdownMenuProject({ onSelect }: DropdownMenuProjectProps) {
  const currentProject = useAppSelector((s) => s.project.project);
  const projects = useAppSelector((s) => s.projects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    currentProject
  );

  useEffect(() => {
    if (currentProject) onSelect(currentProject.id.toString());
  }, [currentProject, onSelect]);

  const handleSelect = (value: string) => {
    const project = projects.find((p) => p.id.toString() === value);
    if (project) setSelectedProject(project);
    onSelect(value);
  };

  const displayProjectName = selectedProject?.name || "Выберите проект";

  return (
    <DropdownMenu
      onSelect={handleSelect}
      value={selectedProject?.id.toString()}
    >
      <DropdownTrigger>
        <div className={styles.trigger}>
          <Icon as={ICONS.project} size="18px" className={styles.icon} />
          <span
            className={selectedProject ? styles.selected : styles.placeholder}
          >
            {displayProjectName}
          </span>
        </div>
      </DropdownTrigger>

      <DropdownContent>
        {projects.map((project) => (
          <DropdownItem key={project.id} value={project.id.toString()}>
            <span>{project.name}</span>
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}
