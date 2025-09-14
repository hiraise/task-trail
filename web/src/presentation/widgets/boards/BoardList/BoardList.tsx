import styles from "./BoardListItem.module.css";

import { Board } from "@/domain/board/board.entity";
import { BoardListItem } from "./BoardListItem";

export function BoardList({ boards }: { boards: Board[] }) {
  return (
    <div className={styles.boardList}>
      {boards.map((board) => (
        <BoardListItem key={board.id} board={board} />
      ))}
    </div>
  );
}
