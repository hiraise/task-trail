import { useQuery } from "@tanstack/react-query";

import type { Board } from "@/domain/models/Board";
import type { Task } from "@/domain/models/Task";
import type { BoardId } from "@/domain/types";
import { boardRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/** Boards where the current user is a member (ADR-0029). */
export function useBoards() {
  return useQuery<Board[], Error>({
    queryKey: QUERY_KEYS.board.all,
    queryFn: () => boardRepository.findAll(),
  });
}

/** A board as the current user sees it; a non-member gets NOT_FOUND. */
export function useBoard(boardId: BoardId) {
  return useQuery<Board, Error>({
    queryKey: QUERY_KEYS.board.detail(boardId),
    queryFn: () => boardRepository.findById(boardId),
    retry: false,
  });
}

/** Board tasks the current user sees, recently updated first. */
export function useBoardTasks(boardId: BoardId) {
  return useQuery<Task[], Error>({
    queryKey: QUERY_KEYS.board.tasks(boardId),
    queryFn: () => boardRepository.findTasks(boardId),
    retry: false,
  });
}
