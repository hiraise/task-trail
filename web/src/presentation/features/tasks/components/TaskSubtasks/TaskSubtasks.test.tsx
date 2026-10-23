import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "@/domain/models/Task";

import { TaskSubtasks } from "./TaskSubtasks";

const createSubtask = vi.fn();
let subtasks: Task[] = [];

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <a href="#" className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: () => ({ closeAllModals: vi.fn() }),
}));

vi.mock("../../../projects/hooks", () => ({
  useProjectMembers: () => ({ data: [] }),
}));

vi.mock("../../hooks", () => ({
  useSubtasks: () => ({ data: subtasks }),
  useTaskStatuses: () => ({ data: [{ id: "open", name: "Открыта", isResolved: false }] }),
  useCreateSubtask: () => ({ mutate: createSubtask, isPending: false }),
}));

const task = (fields: Partial<Task> = {}): Task => ({
  id: "parent",
  projectId: "project",
  number: 12,
  key: "DS-12",
  name: "Сверстать карточку",
  statusId: "open",
  priority: "normal",
  authorId: "anna",
  projectArchived: false,
  labels: [],
  subtasksTotal: 0,
  subtasksDone: 0,
  createdAt: "2026-10-23T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
  ...fields,
});

describe("TaskSubtasks", () => {
  beforeEach(() => {
    subtasks = [];
    createSubtask.mockReset();
  });

  it("is hidden for a subtask: one level", () => {
    const { container } = render(<TaskSubtasks task={task({ parentId: "other" })} readOnly={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the progress and the rows", () => {
    subtasks = [task({ id: "s1", key: "DS-13", name: "Строка TaskMeta", parentId: "parent" })];

    render(<TaskSubtasks task={task({ subtasksTotal: 5, subtasksDone: 2 })} readOnly={false} />);

    expect(screen.getByText("2 из 5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /DS-13.*Строка TaskMeta/ })).toBeInTheDocument();
  });

  it("the empty state, no add button for a read-only task", () => {
    render(<TaskSubtasks task={task()} readOnly />);

    expect(screen.getByText("Подзадач пока нет")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Добавить подзадачу" })).not.toBeInTheDocument();
  });

  it("the add field creates a subtask of this task and stays open", async () => {
    const user = userEvent.setup();

    render(<TaskSubtasks task={task()} readOnly={false} />);
    await user.click(screen.getByRole("button", { name: "Добавить подзадачу" }));
    await user.type(screen.getByPlaceholderText("Название подзадачи"), "  Чипы меток {Enter}");

    expect(createSubtask).toHaveBeenCalledWith(
      { projectId: "project", name: "Чипы меток", parentId: "parent" },
      expect.anything(),
    );
    expect(screen.getByPlaceholderText("Название подзадачи")).toBeInTheDocument();
  });

  it("Escape closes the field without creating", async () => {
    const user = userEvent.setup();

    render(<TaskSubtasks task={task()} readOnly={false} />);
    await user.click(screen.getByRole("button", { name: "Добавить подзадачу" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByPlaceholderText("Название подзадачи")).not.toBeInTheDocument();
    expect(createSubtask).not.toHaveBeenCalled();
  });
});
