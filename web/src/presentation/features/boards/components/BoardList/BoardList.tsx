import type { MockBoardDto } from "@/application/dto/MockBoardDto";

import { BoardListItem } from "./BoardListItem";
import styles from "./BoardListItem.module.css";

export function BoardList({ boards }: { boards: MockBoardDto[] }) {
  return (
    <div className={styles.boardList}>
      {boards.map((board) => (
        <BoardListItem key={board.id} board={board} />
      ))}
    </div>
  );
}
