import { ASSETS } from "@/infrastructure/config/assets";
import { DashboardCardProps } from "./DashboardCard";

export const mockDashboardCardsData: DashboardCardProps[] = [
  {
    icon: ASSETS.icons.board,
    taskCount: 22,
    title: "Разработка мобильного приложения",
    description:
      "Планирование, дизайн и разработка нового приложения для iOS и Android",
  },
  {
    icon: ASSETS.icons.project,
    taskCount: 12,
    title: "Планирование маркетинговой кампании",
    description: "Организация и запуск рекламной кампании для нового продукта",
  },
  {
    icon: ASSETS.icons.board,
    taskCount: 1,
    title: "Бюджет и финансы",
    description: "Планирование и контроль бюджета для текущих проектов",
  },
  {
    icon: ASSETS.icons.board,
    taskCount: 52,
    title: "Встречи и мероприятия",
    description: "Планирование и контроль бюджета для текущих проектов",
  },
];
