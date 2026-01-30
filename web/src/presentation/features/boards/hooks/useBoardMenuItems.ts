import type { BoardId } from "@/domain/types";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { boardsTexts } from "@/shared/locales/boards";

export const useBoardMenuItems = (boardId: BoardId) => {
  console.log("Board id: ", boardId);
  const menuItems: MenuItem[] = [
    {
      label: boardsTexts.menuItems.edit,
      onClick: () => {},
      isVisible: true,
    },
    {
      label: boardsTexts.menuItems.leave,
      onClick: () => {},
      isVisible: true,
    },
    {
      label: boardsTexts.menuItems.delete,
      onClick: () => {},
      isVisible: true,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.isVisible);

  return { menuItems: visibleMenuItems };
};
