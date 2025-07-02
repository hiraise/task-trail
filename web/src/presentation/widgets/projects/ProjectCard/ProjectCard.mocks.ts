import { Project } from "@/domain/project/project.entity";

export const mockProjects: Project[] = [
  {
    id: "1",
    ownerId: "user1",
    name: "Разработка мобильного приложения",
    description:
      "Планирование, дизайн и разработка нового приложения для iOS и Android",
    totalTasks: 22,
  },
  {
    id: "2",
    ownerId: "user1",
    name: "Планирование маркетинговой кампании",
    description: "Организация и запуск рекламной кампании для нового продукта",
    totalTasks: 12,
  },
  {
    id: "3",
    ownerId: "user1",
    name: "Бюджет и финансы",
    description: "Планирование и контроль бюджета для текущих проектов",
    totalTasks: 1,
  },
  {
    id: "4",
    ownerId: "user1",
    name: "Встречи и мероприятия",
    description: "Планирование и контроль бюджета для текущих проектов",
    totalTasks: 52,
  },
  ...generateMockProjects(10),
];

function generateMockProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, index) => ({
    id: (index + 1).toString(),
    ownerId: "user1",
    name: `Проект ${index + 1}`,
    description: `Описание проекта ${index + 1}`,
    totalTasks: Math.floor(Math.random() * 100),
  }));
}
