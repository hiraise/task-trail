"use client";

import styles from "./BoardsMobilePage.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { mockBoards } from "@/domain/board/board.mocks";
import { BoardList, EmptyBoardListMobile } from "@/presentation/widgets/boards/BoardList";
import { TopBarMobile } from "@/presentation/widgets/common/TopBar/TopBarMobile";
import { PagesMobileTemplate } from "@/presentation/templates";

export function BoardsMobilePage() {
  const boards = mockBoards;

  const handleSort = () => {};
  const handleCreateBoard = () => {};

  const topBar = (
    <TopBarMobile title={TEXTS.drawer.myBoards} onClick={handleCreateBoard} onSort={handleSort} />
  );

  return (
    <PagesMobileTemplate topBar={topBar}>
      <div className={styles.container}>
        {(!boards || boards.length === 0) && <EmptyBoardListMobile />}
        {boards.length > 0 && <BoardList boards={boards} />}
      </div>
    </PagesMobileTemplate>
  );
}
