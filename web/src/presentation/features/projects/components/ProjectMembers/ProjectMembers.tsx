import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import { Icon, IconButton, MembersAvatarList } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { MemberGroups } from "./MemberGroups";
import styles from "./ProjectMembers.module.css";

interface ProjectMembersProps {
  projectId: ProjectId;
  members: ProjectMember[];
}

/**
 * Участники на странице проекта. На телефоне — аватарки и стрелка на страницу участников;
 * шире — список по группам с действиями, который можно свернуть в аватарки.
 */
export function ProjectMembers({ projectId, members }: ProjectMembersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={styles.container}>
      <div className={styles.titleWrapper}>
        <h4>{TEXTS.projects.members}</h4>
        <Link to="/projects/$id/members" params={{ id: projectId }} className={styles.phoneOnly}>
          <Icon as={ICONS.rightArrowWithPadding} size="24px" color="var(--icon-secondary)" />
        </Link>
        <span className={styles.wideOnly}>
          <IconButton
            icon={ICONS.rightArrow}
            size="24px"
            className={clsx(styles.toggle, isExpanded && styles.expanded)}
            aria-expanded={isExpanded}
            aria-label={TEXTS.projects.members}
            onClick={() => setIsExpanded((prev) => !prev)}
          />
        </span>
      </div>
      <div className={clsx(isExpanded && styles.phoneOnly)}>
        <MembersAvatarList users={members} variant="large" />
      </div>
      {isExpanded && (
        <div className={styles.wideOnly}>
          <MemberGroups members={members} projectId={projectId} />
        </div>
      )}
    </div>
  );
}
