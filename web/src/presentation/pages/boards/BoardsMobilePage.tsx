"use client";

import styles from "./BoardsMobilePage.module.css";

import { mockBoards } from "@/domain/board/board.mocks";
import { BoardList, EmptyBoardListMobile } from "@/presentation/widgets/boards/BoardList";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { boardsTexts } from "@/shared/locales/boards";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";

export function BoardsMobilePage() {
  const boards = mockBoards;
  const handleSort = () => {};

  const handleCreateBoard = () => {};

  return (
    <MainContainer>
      <DashboardHeader />
      <div className={styles.titleContainer}>
        <h1>{boardsTexts.title}</h1>
        <IconButton icon={ICONS.sort} onClick={handleSort} />
      </div>
      {(!boards || boards.length === 0) && <EmptyBoardListMobile />}
      {boards.length > 0 && <BoardList boards={boards} />}

      <FloatingButton onClick={handleCreateBoard} variant="withBottomNav" />
      <BottomNavBar />
    </MainContainer>
  );
}
