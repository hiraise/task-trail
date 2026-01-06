"use client";

import type { MockBoardDto } from "@/application/dto/MockBoardDto";
import { KanbanBoard } from "@/presentation/features/boards/components";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";

export function BoardMobilePage({ board }: { board: MockBoardDto }) {
  return (
    <PagesMobileTemplate topBarBackTitle={board.name} variant="menu" onActionClick={() => {}}>
      <KanbanBoard board={board} />
    </PagesMobileTemplate>
  );
}
