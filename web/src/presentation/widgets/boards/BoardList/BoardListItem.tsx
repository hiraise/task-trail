import Link from "next/link";

import styles from "./BoardListItem.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { DropdownMenu } from "../../common/DropdownMenu";
import { UserAvatar } from "../../projects/UserAvatar";
import { BoardTitle } from "./BoardTitle";
import { ICONS } from "@/infrastructure/config/icons";
import { Board } from "@/domain/board/board.entity";
import { useBoardMenuItems } from "@/application/boards/useBoardMenuItems";
import { ROUTES } from "@/infrastructure/config/routes";

export function BoardListItem({ board }: { board: Board }) {
  const displayMembers = board.members.slice(0, 7) ?? board.members;

  const { menuItems } = useBoardMenuItems(board.id);
  return (
    <div className={styles.cardWrapper}>
      <Link href={ROUTES.board(board.id)} className={styles.container}>
        <BoardTitle title={board.name} taskCount={board.taskCount} />
        {board.members.length > 0 && (
          <div className={styles.members}>
            {displayMembers.map((member) => (
              <UserAvatar key={member.id} className={styles.memberAvatar} />
            ))}
          </div>
        )}
      </Link>
      <div className={styles.menu}>
        <DropdownMenu trigger={<IconButton icon={ICONS.menu} size="24px" />} items={menuItems} />
      </div>
    </div>
  );
}
