import type { Board } from "@/domain/models/Board";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";

import { useDeleteBoard, useLeaveBoard } from "./useBoardMutations";

/** Whether the current user owns the board: only the owner changes it (ADR-0029). */
export function useIsBoardOwner(board?: Board): boolean {
  const { data: currentUser } = useGetCurrentUser();

  return !!board && !!currentUser && board.ownerId === currentUser.id;
}

/**
 * Board actions (frame 843:91329): the owner renames and deletes the board, a member leaves it.
 * Leaving and deleting are confirmed and lead to "My boards".
 */
export const useBoardMenuItems = (board?: Board) => {
  const isOwner = useIsBoardOwner(board);
  const { data: currentUser } = useGetCurrentUser();
  const { mutate: leave } = useLeaveBoard();
  const { mutate: deleteBoard } = useDeleteBoard();
  const { showRenameBoard, showLeaveProject, showDeleteItem } = useGlobalModals();

  if (!board || !currentUser) return { menuItems: [] };

  const menuItems: MenuItem[] = [
    {
      label: boardsTexts.rename,
      icon: ICONS.edit,
      color: "var(--icon-tertiary)",
      onClick: () => showRenameBoard({ boardId: board.id, name: board.name }),
      isVisible: isOwner,
    },
    {
      label: boardsTexts.leave,
      icon: ICONS.leave,
      color: "var(--icon-tertiary)",
      onClick: async () => {
        const result = await showLeaveProject({ id: board.id, title: board.name, kind: "board" });

        if (result) leave(board.id);
      },
      isVisible: !isOwner,
    },
    {
      label: boardsTexts.delete,
      icon: ICONS.delete,
      color: "var(--icon-critical)",
      onClick: async () => {
        const result = await showDeleteItem({ type: "board", id: board.id, title: board.name });

        if (result) deleteBoard(board.id);
      },
      isVisible: isOwner,
    },
  ];

  return { menuItems: menuItems.filter((item) => item.isVisible) };
};
