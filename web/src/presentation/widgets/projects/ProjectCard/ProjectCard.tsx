import { useState } from "react";

import styles from "./ProjectCard.module.css";

import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";
import { Project } from "@/domain/project/project.entity";
import { useGetProjectMembers } from "@/application/projects/hooks/useProject";
import { MembersAvatarList } from "../../tasks/ProjectsList/MembersAvatarList";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { data: members } = useGetProjectMembers(project.id);
  const memberIds = members?.map((member) => member.id) || [];

  const [isHovered, setIsHovered] = useState(false);

  const textColor = isHovered ? "var(--text-primary-contrast)" : "var(--text-primary)";
  const bgColor = isHovered ? "var(--bg-primary-contrast)" : "var(--bg-secondary-2)";
  const titleStyle = { color: textColor };
  const textStyle = { color: textColor, opacity: isHovered ? 0.6 : 1 };

  return (
    <div
      className={styles.cardContainer}
      style={{ backgroundColor: bgColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.cardTextWrapper}>
        <h4 style={titleStyle}>{project.name}</h4>
        <p className="body-reg-2" style={textStyle}>
          {project.description}
        </p>
      </div>
      <div className={styles.infoWrapper}>
        {memberIds.length > 0 && (
          <MembersAvatarList memberIds={memberIds} bgColor={bgColor} variant="standard" />
        )}
        <span className="caption-reg">{pluralizeTasks(project.totalTasks)}</span>
      </div>
    </div>
  );
}
