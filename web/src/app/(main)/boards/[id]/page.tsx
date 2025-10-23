"use client";

import { useParams } from "next/navigation";
import { mockBoards } from "@/domain/board/board.mocks";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { BoardMobilePage } from "@/presentation/pages/boards";

export default function BoardPage() {
  const params = useParams();
  const boardId = Number(params.id);

  const board = mockBoards.find((b) => b.id === boardId);

  if (!board) return null;

  return (
    <DeviceBased
      desktop={<BoardMobilePage board={board} />}
      mobile={<BoardMobilePage board={board} />}
    />
  );
}
