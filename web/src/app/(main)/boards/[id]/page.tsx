"use client";

import { useParams } from "next/navigation";

import { mockBoards } from "@/application/dto/MockBoardDto";
import type { BoardId } from "@/domain/types";
import { BoardMobilePage } from "@/presentation/features/boards/pages";
import { DeviceBased } from "@/presentation/shared";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as BoardId;

  const board = mockBoards.find((b) => b.id === boardId);

  if (!board) return null;

  return (
    <DeviceBased
      desktop={<BoardMobilePage board={board} />}
      mobile={<BoardMobilePage board={board} />}
    />
  );
}
