import clsx from "clsx";
import { AnimatePresence, motion as m } from "framer-motion";

import { getUserDisplayName } from "@/domain/models/User";
import { Icon, UserAvatar } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";

import type { Lane } from "./kanban";
import styles from "./KanbanBoard.module.css";

interface KanbanLaneProps {
  lane: Lane;
  collapsed: boolean;
  onToggle: () => void;
  /** The lane's cells, one per column */
  children: React.ReactNode;
}

/**
 * A swimlane: a board member or the "no assignee" lane. The name stays in place while the board
 * scrolls sideways; a lane collapses (frames 980:35550, 980:37046).
 */
export function KanbanLane({ lane, collapsed, onToggle, children }: KanbanLaneProps) {
  const name = lane.user ? getUserDisplayName(lane.user) : boardsTexts.noAssignee;

  return (
    <div className={styles.lane}>
      <button
        type="button"
        className={styles.laneTitle}
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span className={clsx(styles.chevron, !collapsed && styles.chevronOpen)}>
          <Icon as={ICONS.rightArrow} size="24px" />
        </span>
        {lane.user && <UserAvatar variant="small" src={lane.user.avatarUrl} name={name} />}
        <span className="body-med">{name}</span>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <m.div
            className={styles.laneBody}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            role="region"
            aria-label={name}
          >
            <div className={styles.grid}>{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
