export interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string;
  status: "todo" | "in-progress" | "done";
}

export const tasks: Task[] = [
  {
    id: 1,
    title: "Подготовить презентацию",
    description: "Create wireframes and UI for the login page.",
    assignee: "Alice",
    status: "todo",
  },
  {
    id: 2,
    title:
      "Вдохновляющая и длинная задача в две строки длиною: найти новый подход",
    description: "Set up JWT-based authentication.",
    assignee: "Bob",
    status: "in-progress",
  },
  {
    id: 3,
    title:
      "Вдохновляющая и длинная задача в две строки длиною: найти новый подход",
    description: "Design tables for users and tasks.",
    assignee: "Charlie",
    status: "done",
  },
  {
    id: 4,
    title: "Обновить дизайн",
    description: "Add tests for user service.",
    assignee: "Dana",
    status: "todo",
  },
  {
    id: 5,
    title: "Create project dashboard",
    description: "Develop dashboard UI for projects.",
    assignee: "Eve",
    status: "in-progress",
  },
  {
    id: 6,
    title: "Integrate API",
    description: "Connect frontend to backend API.",
    assignee: "Frank",
    status: "done",
  },
  {
    id: 7,
    title: "Fix bug in task list",
    description: "Resolve issue with task sorting.",
    assignee: "Grace",
    status: "todo",
  },
  {
    id: 8,
    title: "Update documentation",
    description: "Revise README and API docs.",
    assignee: "Heidi",
    status: "in-progress",
  },
  {
    id: 9,
    title: "Optimize performance",
    description: "Improve page load times.",
    assignee: "Ivan",
    status: "done",
  },
  {
    id: 10,
    title: "Add notifications",
    description: "Implement notification system.",
    assignee: "Judy",
    status: "todo",
  },
  {
    id: 11,
    title: "Refactor codebase",
    description: "Clean up and organize code.",
    assignee: "Karl",
    status: "in-progress",
  },
  {
    id: 12,
    title: "Set up CI/CD",
    description: "Configure automated deployments.",
    assignee: "Laura",
    status: "done",
  },
  {
    id: 13,
    title: "Implement search",
    description: "Add search functionality for tasks.",
    assignee: "Mallory",
    status: "todo",
  },
  {
    id: 14,
    title: "Design settings page",
    description: "Create UI for user settings.",
    assignee: "Niaj",
    status: "in-progress",
  },
  {
    id: 15,
    title: "Add user avatars",
    description: "Display avatars in member list.",
    assignee: "Olivia",
    status: "done",
  },
  {
    id: 16,
    title: "Configure linter",
    description: "Set up ESLint for code quality.",
    assignee: "Peggy",
    status: "todo",
  },
  {
    id: 17,
    title: "Implement dark mode",
    description: "Add dark mode toggle.",
    assignee: "Quentin",
    status: "in-progress",
  },
  {
    id: 18,
    title: "Fix mobile layout",
    description: "Resolve responsive design issues.",
    assignee: "Rupert",
    status: "done",
  },
  {
    id: 19,
    title: "Add comments feature",
    description: "Enable comments on tasks.",
    assignee: "Sybil",
    status: "todo",
  },
  {
    id: 20,
    title: "Improve accessibility",
    description: "Enhance accessibility for all users.",
    assignee: "Trent",
    status: "in-progress",
  },
];
