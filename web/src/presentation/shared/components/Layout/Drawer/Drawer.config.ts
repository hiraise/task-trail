import type { ComponentType, SVGProps } from "react";

import { ASSETS } from "@/shared/config/assets";
import { ROUTES } from "@/shared/config/routes";
import { TEXTS } from "@/shared/locales/texts";

export interface NavMenuItem {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}

export const navItems: NavMenuItem[] = [
  {
    href: ROUTES.projects,
    icon: ASSETS.icons.project,
    label: TEXTS.drawer.myProjects,
  },
  {
    href: ROUTES.boards,
    icon: ASSETS.icons.board,
    label: TEXTS.drawer.myBoards,
  },
  {
    href: ROUTES.tasks,
    icon: ASSETS.icons.task,
    label: TEXTS.drawer.myTasks,
  },
  {
    href: ROUTES.profile,
    icon: ASSETS.icons.profile,
    label: TEXTS.drawer.myProfile,
  },
];

/** Service administrator section: in the menu only for the administrator (ADR-0014) */
export const adminItem: NavMenuItem = {
  href: ROUTES.admin,
  icon: ASSETS.icons.settings,
  label: TEXTS.drawer.admin,
};

export const searchItem = {
  href: ROUTES.search,
  icon: ASSETS.icons.search,
  label: TEXTS.drawer.search,
};
