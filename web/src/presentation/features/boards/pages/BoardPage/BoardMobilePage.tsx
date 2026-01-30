"use client";

import type { MockBoardDto } from "@/application/dto/MockBoardDto";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";

import { KanbanBoard } from "../../components";

export function BoardMobilePage({ board }: { board: MockBoardDto }) {
  return (
    <PagesMobileTemplate topBarBackTitle={board.name} variant="menu" onActionClick={() => {}}>
      <KanbanBoard board={board} />
    </PagesMobileTemplate>
  );
}
