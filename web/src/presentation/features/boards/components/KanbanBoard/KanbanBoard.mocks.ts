import type { ProjectId, TaskId, UserId } from "@/domain/types";

export const boardColumns = ["Open", "In progress", "To verify", "Done"] as const;

export type TaskStatus = (typeof boardColumns)[number];

export type MockTask = {
  id: TaskId;
  userId: UserId;
  status: TaskStatus;
  text: string;
  projectId: ProjectId;
};

export const mockBoardTasks: MockTask[] = Array.from({ length: 20 }, (_, i) => ({
  id: `${i + 1}`,
  userId: `${Math.floor(Math.random() * 9)}`,
  status: boardColumns[i % boardColumns.length],
  text: `Тестовая задача #${i + 1} для статуса "${boardColumns[i % boardColumns.length]}"`,
  projectId: "1",
}));
