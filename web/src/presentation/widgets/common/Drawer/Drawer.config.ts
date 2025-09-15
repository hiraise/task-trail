import { ASSETS } from "@/infrastructure/config/assets";
import { ROUTES } from "@/infrastructure/config/routes";
import { TEXTS } from "@/shared/locales/texts";

export interface NavMenuItem {
  href: string;
  icon: React.FC<React.SVGProps<SVGElement>>;
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

//TODO: replace href with propper one
export const searchItem = {
  href: ROUTES.dashboard,
  icon: ASSETS.icons.search,
  label: TEXTS.drawer.search,
};
