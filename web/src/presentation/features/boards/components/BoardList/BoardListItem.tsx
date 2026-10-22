import { Link } from "@tanstack/react-router";

import type { MockBoardDto } from "@/application/dto/MockBoardDto";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { MembersAvatarList } from "@/presentation/shared/components/MembersAvatarList";
import { ICONS } from "@/shared/config/icons";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

import { useBoardMenuItems } from "../../hooks";

import styles from "./BoardListItem.module.css";

export function BoardListItem({ board }: { board: MockBoardDto }) {
  // Доски — заглушка с выдуманными людьми: их внешние аватарки не грузим
  const members = board.members.map((member) => ({ ...member, avatarUrl: undefined }));

  const { menuItems } = useBoardMenuItems();

  return (
    <div className={styles.cardWrapper}>
      <Link to={"/boards/$id"} params={{ id: board.id }} className={styles.card}>
        <div className={styles.titleWrapper}>
          <h4 className="multiline-3">{board.name}</h4>
          <span className="caption-reg">{pluralizeTasks(board.taskCount)}</span>
        </div>

        {board.members.length > 0 && <MembersAvatarList maxVisible={6} users={members} />}
      </Link>
      <div className={styles.menu}>
        <DropdownMenu
          trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
          items={menuItems}
        />
      </div>
    </div>
  );
}
