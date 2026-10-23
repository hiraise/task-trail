import { useState } from "react";

import { isProjectArchived, type Project } from "@/domain/models/Project";
import { ArchiveTag, HighlightedText, MembersAvatarList } from "@/presentation/shared";
import { useProjectMembers } from "@/presentation/shared/hooks";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

import styles from "./ProjectCard.module.css";

interface ProjectCardProps {
  project: Project;
  /** A search query to highlight in the name (ADR-0030) */
  highlight?: string;
}

export function ProjectCard({ project, highlight }: ProjectCardProps) {
  const { data: members = [] } = useProjectMembers(project.id);

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
        {isProjectArchived(project) && <ArchiveTag />}
        <h4 style={titleStyle}>
          <HighlightedText text={project.name} highlight={highlight} />
        </h4>
        <p className="body-reg-2" style={textStyle}>
          {project.description}
        </p>
      </div>
      <div className={styles.infoWrapper}>
        {members.length > 0 && (
          <MembersAvatarList users={members} bgColor={bgColor} variant="standard" />
        )}
        <span className="caption-reg">{pluralizeTasks(project.tasksCount)}</span>
      </div>
    </div>
  );
}
