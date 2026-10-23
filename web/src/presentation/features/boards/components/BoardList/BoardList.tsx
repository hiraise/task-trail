import type { Board } from "@/domain/models/Board";

import { BoardListItem } from "./BoardListItem";
import styles from "./BoardListItem.module.css";

export function BoardList({ boards }: { boards: Board[] }) {
  return (
    <div className={styles.boardList}>
      {boards.map((board) => (
        <BoardListItem key={board.id} board={board} />
      ))}
    </div>
  );
}
