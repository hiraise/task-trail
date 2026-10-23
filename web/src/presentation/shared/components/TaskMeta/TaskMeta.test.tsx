import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Task } from "@/domain/models/Task";
import { todayLocal } from "@/shared/utils/dueDate";

import { TaskMeta } from "./TaskMeta";

vi.mock("@/presentation/shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTaskStatuses: () => ({
    data: [
      { id: "open", name: "Открыта", isResolved: false },
      { id: "done", name: "Готово", isResolved: true },
    ],
  }),
}));

const day = (offset: number) => {
  const date = new Date();

  date.setDate(date.getDate() + offset);

  return todayLocal(date);
};

const task = (fields: Partial<Task> = {}): Task => ({
  id: "task",
  projectId: "project",
  number: 1,
  key: "DS-1",
  name: "Собрать отчёт",
  statusId: "open",
  priority: "normal",
  authorId: "anna",
  projectArchived: false,
  createdAt: "2026-10-23T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
  ...fields,
});

describe("TaskMeta", () => {
  it("renders nothing for a normal task", () => {
    const { container } = render(<TaskMeta task={task()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the urgent priority icon with its name", () => {
    render(<TaskMeta task={task({ priority: "urgent" })} />);

    expect(screen.getByRole("img", { name: "Срочный" })).toBeInTheDocument();
  });

  it("tomorrow's due date in words", () => {
    render(<TaskMeta task={task({ dueDate: day(1) })} />);

    expect(screen.getByText("Завтра")).toBeInTheDocument();
  });

  it("an open task due yesterday is overdue", () => {
    render(<TaskMeta task={task({ dueDate: day(-1) })} />);

    expect(screen.getByText(/\d/).className).toMatch(/overdue/);
  });

  it("a resolved task due yesterday is not overdue", () => {
    render(<TaskMeta task={task({ dueDate: day(-1), statusId: "done" })} />);

    expect(screen.getByText(/\d/).className).not.toMatch(/overdue/);
  });
});
