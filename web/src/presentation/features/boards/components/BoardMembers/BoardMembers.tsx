import clsx from "clsx";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import type { Board } from "@/domain/models/Board";
import { Icon, IconButton, MembersAvatarList } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";

import { BoardMemberGroups } from "./BoardMemberGroups";
import styles from "./BoardMembers.module.css";

interface BoardMembersProps {
  board: Board;
  isOwner: boolean;
}

/**
 * "Members on the board". On a phone — avatars and an arrow to the members page (frames 843:92288,
 * 919:61858); wider — groups that expand in place and collapse into avatars.
 */
export function BoardMembers({ board, isOwner }: BoardMembersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h4>{boardsTexts.members}</h4>
        <Link to="/boards/$id/members" params={{ id: board.id }} className={styles.phoneOnly}>
          <Icon as={ICONS.rightArrowWithPadding} size="24px" color="var(--icon-secondary)" />
        </Link>
        <span className={styles.wideOnly}>
          <IconButton
            icon={ICONS.rightArrow}
            size="24px"
            className={clsx(styles.toggle, isExpanded && styles.expanded)}
            aria-expanded={isExpanded}
            aria-label={boardsTexts.members}
            onClick={() => setIsExpanded((prev) => !prev)}
          />
        </span>
      </div>
      <div className={clsx(isExpanded && styles.phoneOnly)}>
        <MembersAvatarList users={board.members} variant="large" />
      </div>
      {isExpanded && (
        <div className={styles.wideOnly}>
          <BoardMemberGroups board={board} isOwner={isOwner} />
        </div>
      )}
    </div>
  );
}
