"use client";

import "./styles.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { ICONS } from "@/infrastructure/config/icons";
import { FloatingButton } from "@/presentation/widgets/projects/FloatingButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { boardsTexts } from "@/shared/locales/boards";
import { mockBoards } from "@/domain/board/board.mocks";
import { BoardList } from "@/presentation/widgets/boards/BoardList";

function EmptyBoardList() {
  return (
    <div className="empty-state">
      <h2>{boardsTexts.noBoards}</h2>
      <p>{boardsTexts.createFirstBoard}</p>
    </div>
  );
}

export default function BoardsPage() {
  const boards = mockBoards;
  const handleSort = () => {};

  const handleCreateBoard = () => {};

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="title-container">
        <h1>{boardsTexts.title}</h1>
        <IconButton icon={ICONS.sort} onClick={handleSort} />
      </div>
      {(!boards || boards.length === 0) && <EmptyBoardList />}
      {boards.length > 0 && <BoardList boards={boards} />}

      <FloatingButton onClick={handleCreateBoard} variant="withBottomNav" />
      <BottomNavBar />
    </MainContainer>
  );
}
