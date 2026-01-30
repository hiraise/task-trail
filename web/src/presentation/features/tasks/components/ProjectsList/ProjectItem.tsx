import clsx from "clsx";

import type { Project } from "@/domain/models/Project";
import { MembersAvatarList } from "@/presentation/shared";
import { useProjectMembers } from "@/presentation/shared/hooks";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

import styles from "./ProjectItem.module.css";

interface ProjectItemProps {
  project: Project;
  isSelected?: boolean;
  onClick?: (project: Project) => void;
}

export function ProjectItem({ project, isSelected, onClick }: ProjectItemProps) {
  const { data: members } = useProjectMembers(project.id);
  const memberIds = members?.map((member) => member.id) || [];

  return (
    <button
      className={clsx(styles.container, isSelected && styles.selected)}
      onClick={() => onClick?.(project)}
    >
      <div className={styles.titleWrapper}>
        <h4>{project.name}</h4>
        {project.description && <span className="body-reg-2">{project.description}</span>}
      </div>
      <div className={styles.infoWrapper}>
        {memberIds.length > 0 && <MembersAvatarList memberIds={memberIds} />}
        <span className="caption-reg">{pluralizeTasks(project.tasksCount)}</span>
      </div>
    </button>
  );
}
