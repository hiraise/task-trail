import clsx from "clsx";

import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { MembersAvatarList } from "@/presentation/shared";
import { useProjectMembers } from "@/presentation/shared/hooks";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

import styles from "./ProjectItem.module.css";

interface ProjectItemProps {
  project: ProjectResponseDto;
  isSelected?: boolean;
  onClick?: (project: ProjectResponseDto) => void;
}

export function ProjectItem({ project, isSelected, onClick }: ProjectItemProps) {
  const { data: members } = useProjectMembers(Number(project.id));
  const memberIds = members?.map((member) => Number(member.id)) || [];

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
