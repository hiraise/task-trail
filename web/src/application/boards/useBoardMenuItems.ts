import { boardsTexts } from "@/shared/locales/boards";

export interface MenuItem {
  label: string;
  onClick: () => void;
  isVisible: boolean;
}

export const useBoardMenuItems = (boardId: number) => {
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
