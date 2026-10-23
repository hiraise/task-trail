import { Link } from "@tanstack/react-router";

import type { Board } from "@/domain/models/Board";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { MembersAvatarList } from "@/presentation/shared/components/MembersAvatarList";
import { ICONS } from "@/shared/config/icons";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

import { useBoardMenuItems } from "../../hooks";

import styles from "./BoardListItem.module.css";

/** A board card in "My boards": name up to three lines, task count, member avatars, the "…" menu. */
export function BoardListItem({ board }: { board: Board }) {
  const { menuItems } = useBoardMenuItems(board);

  return (
    <div className={styles.cardWrapper}>
      <Link to="/boards/$id" params={{ id: board.id }} className={styles.card}>
        <div className={styles.titleWrapper}>
          <h4 className="multiline-3">{board.name}</h4>
          <span className="caption-reg">{pluralizeTasks(board.tasksCount)}</span>
        </div>
        <MembersAvatarList maxVisible={6} users={board.members} />
      </Link>
      {menuItems.length > 0 && (
        <div className={styles.menu}>
          <DropdownMenu
            trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
            items={menuItems}
          />
        </div>
      )}
    </div>
  );
}
