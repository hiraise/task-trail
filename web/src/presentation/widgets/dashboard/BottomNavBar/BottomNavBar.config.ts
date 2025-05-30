import { ASSETS } from "@/infrastructure/config/assets";
import { ROUTES } from "@/infrastructure/config/routes";
import { sharedTexts } from "@/shared/locales/sharedTexts";

export const navItems = [
  {
    href: ROUTES.projects,
    icon: ASSETS.icons.project,
    label: sharedTexts.projects,
  },
  {
    href: ROUTES.boards,
    icon: ASSETS.icons.board,
    label: sharedTexts.boards,
  },
  {
    href: ROUTES.tasks,
    icon: ASSETS.icons.task,
    label: sharedTexts.tasks,
  },
  {
    href: ROUTES.archive,
    icon: ASSETS.icons.archive,
    label: sharedTexts.archive,
  },
];
