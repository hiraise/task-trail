import Link from "next/link";

import type { MockBoardDto } from "@/application/dto/MockBoardDto";
import { useBoardMenuItems } from "@/presentation/features/boards/hooks";
import { DropdownMenu, IconButton } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { ROUTES } from "@/shared/config/routes";
import { pluralizeTasks } from "@/shared/utils/pluralizeTasks";

import { MembersAvatarList } from "../../../../shared/components/MembersAvatarList/MembersAvatarList";

import styles from "./BoardListItem.module.css";

export function BoardListItem({ board }: { board: MockBoardDto }) {
  const memberIds = board.members.map((m) => m.id);

  const { menuItems } = useBoardMenuItems(board.id);
  return (
    <div className={styles.cardWrapper}>
      <Link href={ROUTES.board(board.id)} className={styles.card}>
        <div className={styles.titleWrapper}>
          <h4 className="multiline-3">{board.name}</h4>
          <span className="caption-reg">{pluralizeTasks(board.taskCount)}</span>
        </div>

        {board.members.length > 0 && <MembersAvatarList maxVisible={6} memberIds={memberIds} />}
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
