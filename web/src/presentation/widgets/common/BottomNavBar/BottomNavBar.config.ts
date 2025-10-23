import { ASSETS } from "@/infrastructure/config/assets";
import { ROUTES } from "@/infrastructure/config/routes";
import { TEXTS } from "@/shared/locales/texts";

export interface NavItem {
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
}

export const navItems: NavItem[] = [
  {
    href: ROUTES.projects,
    icon: ASSETS.icons.project,
    label: TEXTS.navBar.projects,
  },
  {
    href: ROUTES.boards,
    icon: ASSETS.icons.board,
    label: TEXTS.navBar.boards,
  },
  {
    href: ROUTES.tasks,
    icon: ASSETS.icons.task,
    label: TEXTS.navBar.tasks,
  },
  {
    href: ROUTES.profile,
    icon: ASSETS.icons.profile,
    label: TEXTS.navBar.profile,
  },
];
