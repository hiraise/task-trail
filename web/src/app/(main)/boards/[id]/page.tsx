"use client";

import { useParams } from "next/navigation";

import { mockBoards } from "@/application/dto/MockBoardDto";
import { BoardMobilePage } from "@/presentation/features/boards/pages";
import { DeviceBased } from "@/presentation/shared";

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
