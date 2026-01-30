"use client";

import { mockBoards } from "@/application/dto/MockBoardDto";
import { EmptyListState } from "@/presentation/shared";
import { PagesMobileTemplate, TopBarMobile } from "@/presentation/shared/components/Layout";
import { ASSETS } from "@/shared/config/assets";
import { TEXTS } from "@/shared/locales/texts";

import { BoardList } from "../../components";

import styles from "./BoardsMobilePage.module.css";

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
