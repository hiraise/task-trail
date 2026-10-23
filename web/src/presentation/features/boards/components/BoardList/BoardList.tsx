import type { Board } from "@/domain/models/Board";

import { BoardListItem } from "./BoardListItem";
import styles from "./BoardListItem.module.css";

interface BoardListProps {
  boards: Board[];
  /** A search query to highlight in the names (ADR-0030) */
  highlight?: string;
}

export function BoardList({ boards, highlight }: BoardListProps) {
  return (
    <div className={styles.boardList}>
      {boards.map((board) => (
        <BoardListItem key={board.id} board={board} highlight={highlight} />
      ))}
    </div>
  );
}
