import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Board } from "@/domain/models/Board";
import type { NewBoard } from "@/domain/repositories/BoardRepository";
import type { BoardId, ProjectId, UserId } from "@/domain/types";
import { boardRepository } from "@/infrastructure/repositories";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { toastError } from "@/shared/errors/errorMessage";
import { boardsTexts } from "@/shared/locales/boards";

// A board change answers with the board (ADR-0018): it goes into the cache, the list is refetched.
// Its tasks depend on its projects and members — they are refetched too.
function storeBoard(queryClient: QueryClient, board: Board, { tasksChanged = false } = {}) {
  queryClient.setQueryData(QUERY_KEYS.board.detail(board.id), board);
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.all });
  if (tasksChanged) queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.tasks(board.id) });
}

// The board is gone for the current user: back to "My boards", its cache is dropped.
async function forgetBoard(
  queryClient: QueryClient,
  navigate: ReturnType<typeof useNavigate>,
  boardId: BoardId,
) {
  await navigate({ to: ROUTES.boards, replace: true });
  queryClient.removeQueries({ queryKey: QUERY_KEYS.board.detail(boardId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.all });
}

/** Creates a board and opens it. */
export function useCreateBoard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<Board, Error, NewBoard>({
    mutationFn: (board) => boardRepository.create(board),
    onSuccess: (board) => {
      storeBoard(queryClient, board);
      toast.success(boardsTexts.boardCreated);
      navigate({ to: "/boards/$id", params: { id: board.id } });
    },
    onError: (error) => toastError(error, boardsTexts.createFailed),
  });
}

export function useRenameBoard() {
  const queryClient = useQueryClient();

  return useMutation<Board, Error, { boardId: BoardId; name: string }>({
    mutationFn: ({ boardId, name }) => boardRepository.rename(boardId, name),
    onSuccess: (board) => {
      storeBoard(queryClient, board);
      toast.success(boardsTexts.renamed);
    },
    onError: (error) => toastError(error, boardsTexts.renameFailed),
  });
}

export function useSetBoardProjects() {
  const queryClient = useQueryClient();

  return useMutation<Board, Error, { boardId: BoardId; projectIds: ProjectId[] }>({
    mutationFn: ({ boardId, projectIds }) => boardRepository.setProjects(boardId, projectIds),
    onSuccess: (board) => {
      storeBoard(queryClient, board, { tasksChanged: true });
      toast.success(boardsTexts.projectsSaved);
    },
    onError: (error) => toastError(error, boardsTexts.setProjectsFailed),
  });
}

export function useAddBoardMembers() {
  const queryClient = useQueryClient();

  return useMutation<Board, Error, { boardId: BoardId; userIds: UserId[] }>({
    mutationFn: ({ boardId, userIds }) => boardRepository.addMembers(boardId, userIds),
    onSuccess: (board) => {
      storeBoard(queryClient, board, { tasksChanged: true });
      toast.success(boardsTexts.membersAdded);
    },
    onError: (error) => toastError(error, boardsTexts.addMembersFailed),
  });
}

/** The owner removes a member: their tasks leave the board, the tasks themselves do not change. */
export function useRemoveBoardMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { boardId: BoardId; userId: UserId }>({
    mutationFn: ({ boardId, userId }) => boardRepository.removeMember(boardId, userId),
    onSuccess: (_, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.detail(boardId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.board.all });
      toast.success(boardsTexts.memberRemoved);
    },
    onError: (error) => toastError(error, boardsTexts.removeMemberFailed),
  });
}

/** A member leaves the board (the owner deletes it instead — OWNER_CANNOT_LEAVE). */
export function useLeaveBoard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, BoardId>({
    mutationFn: (boardId) => boardRepository.leave(boardId),
    onSuccess: async (_, boardId) => {
      toast.success(boardsTexts.left);
      await forgetBoard(queryClient, navigate, boardId);
    },
    onError: (error) => toastError(error, boardsTexts.leaveFailed),
  });
}

/** The owner deletes the board at once; the tasks stay (ADR-0029). */
export function useDeleteBoard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, BoardId>({
    mutationFn: (boardId) => boardRepository.delete(boardId),
    onSuccess: async (_, boardId) => {
      toast.success(boardsTexts.deleted);
      await forgetBoard(queryClient, navigate, boardId);
    },
    onError: (error) => toastError(error, boardsTexts.deleteFailed),
  });
}
