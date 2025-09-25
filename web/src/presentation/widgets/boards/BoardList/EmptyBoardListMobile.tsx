import styles from "./EmptyBoardListMobile.module.css";

import { boardsTexts } from "@/shared/locales/boards";

export function EmptyBoardListMobile() {
  return (
    <div className={styles.emptyState}>
      <h2>{boardsTexts.noBoards}</h2>
      <p>{boardsTexts.createFirstBoard}</p>
    </div>
  );
}
