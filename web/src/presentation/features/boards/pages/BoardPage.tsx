import { useParams } from "@tanstack/react-router";

import type { BoardId } from "@/domain/types";
import { mockBoards } from "@/application/dto/MockBoardDto";
import { DeviceBased } from "@/presentation/shared";

import { BoardMobilePage } from "./BoardPage/BoardMobilePage";

export function BoardPage() {
  const { id } = useParams({ from: "/_main/boards/$id" });
  const boardId = id as BoardId;

  const board = mockBoards.find((b) => b.id === boardId);

  if (!board) return null;

  return (
    <DeviceBased
      desktop={<BoardMobilePage board={board} />}
      mobile={<BoardMobilePage board={board} />}
    />
  );
}
