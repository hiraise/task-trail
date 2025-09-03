import styles from "./BoardListItem.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { DropdownMenu } from "../../projects/DropdownMenu";
import { UserAvatar } from "../../projects/UserAvatar";
import { BoardTitle } from "./BoardTitle";
import { ICONS } from "@/infrastructure/config/icons";
import { Board } from "@/domain/board/board.entity";
import { useBoardMenuItems } from "@/application/boards/useBoardMenuItems";

export function BoardListItem({ board }: { board: Board }) {
  const displayMembers = board.members.slice(0, 7) ?? board.members;

  const handleClick = () => {
    console.log("Button clicked.");
  };

  const { menuItems } = useBoardMenuItems(board.id);
  return (
    <div className={styles.cardWrapper}>
      <div className={styles.container} onClick={handleClick}>
        <BoardTitle title={board.name} taskCount={board.taskCount} />
        {board.members.length > 0 && (
          <div className={styles.members}>
            {displayMembers.map((member) => (
              <UserAvatar key={member.id} className={styles.memberAvatar} />
            ))}
          </div>
        )}
      </div>
      <div className={styles.menu}>
        <DropdownMenu trigger={<IconButton icon={ICONS.menu} size="24px" />} items={menuItems} />
      </div>
    </div>
  );
}
