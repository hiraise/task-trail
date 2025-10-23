"use client";

import { Board } from "@/domain/board/board.entity";
import { PagesMobileTemplate } from "@/presentation/templates";
import { KanbanBoard } from "@/presentation/widgets/boards/KanbanBoard";

export function BoardMobilePage({ board }: { board: Board }) {
  return (
    <PagesMobileTemplate topBarBackTitle={board.name} variant="menu" onActionClick={() => {}}>
      <KanbanBoard board={board} />
    </PagesMobileTemplate>
  );
}
