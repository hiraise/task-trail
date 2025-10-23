"use client";

import styles from "./BoardsMobilePage.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { mockBoards } from "@/domain/board/board.mocks";
import { BoardList } from "@/presentation/widgets/boards/BoardList";
import { TopBarMobile } from "@/presentation/widgets/common/TopBar/TopBarMobile";
import { PagesMobileTemplate } from "@/presentation/templates";
import { EmptyListState } from "@/presentation/widgets/common/EmptyListState/EmptyListState";
import { ASSETS } from "@/infrastructure/config/assets";

export function BoardsMobilePage() {
  const boards = mockBoards;
  // const boards = [];

  const handleSort = () => {};
  const handleCreateBoard = () => {};

  const topBar = (
    <TopBarMobile title={TEXTS.drawer.myBoards} onClick={handleCreateBoard} onSort={handleSort} />
  );

  return (
    <PagesMobileTemplate topBar={topBar}>
      <div className={styles.container}>
        {(!boards || boards.length === 0) && (
          <EmptyListState
            src={ASSETS.images.board}
            alt={TEXTS.boards.boardAlt}
            btnLabel={TEXTS.boards.createButton}
            onClick={handleCreateBoard}
            text={TEXTS.boards.empty}
          />
        )}
        {boards.length > 0 && <BoardList boards={boards} />}
      </div>
    </PagesMobileTemplate>
  );
}
