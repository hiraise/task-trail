"use client";

import "./styles.css";

import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BackButton } from "@/presentation/ui/BackButton";
import { DropdownMenu } from "@/presentation/widgets/projects/DropdownMenu";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { useBoardMenuItems } from "@/application/boards/useBoardMenuItems";
import { useParams } from "next/navigation";
import { mockBoards } from "@/domain/board/board.mocks";
import { Board } from "@/domain/board/board.entity";
import { KanbanBoard } from "@/presentation/widgets/boards/KanbanBoard";

function BoardTopBar({ board }: { board: Board }) {
  const { menuItems } = useBoardMenuItems(board.id);

  return (
    <div className="topBar">
      <BackButton />
      <span className="boardTitle">{board?.name}</span>
      <DropdownMenu trigger={<IconButton icon={ICONS.menu} size="24px" />} items={menuItems} />
    </div>
  );
}

export default function BoardPage() {
  const params = useParams();
  const boardId = Number(params.id);

  const board = mockBoards.find((b) => b.id === boardId);

  if (!board) return null;

  return (
    <main>
      <DashboardHeader />
      <BoardTopBar board={board} />
      <KanbanBoard board={board} />
    </main>
  );
}
