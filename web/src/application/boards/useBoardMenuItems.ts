import { MenuItem } from "@/presentation/widgets/common/DropdownMenu";
import { boardsTexts } from "@/shared/locales/boards";

export const useBoardMenuItems = (boardId: number) => {
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
