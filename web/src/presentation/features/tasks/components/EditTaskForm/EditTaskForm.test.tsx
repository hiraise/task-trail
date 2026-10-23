import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import type { Task } from "@/domain/models/Task";

import { EditTaskForm } from "./EditTaskForm";

const task: Task = {
  id: "0b8c2f4e-3d5a-4a51-9a8e-1c2b3d4e5f60",
  projectId: "5c3f8e21-9b4d-4e6a-8f12-3a4b5c6d7e80",
  number: 12,
  key: "DS-12",
  name: "Собрать отчёт",
  description: "К пятнице",
  statusId: "open",
  priority: "normal",
  authorId: "7d1e9a52-6f0b-4c1f-8f43-2a9e5b7c1d08",
  projectArchived: false,
  labels: [],
  subtasksTotal: 0,
  subtasksDone: 0,
  createdAt: "2026-10-22T08:00:00Z",
  updatedAt: "2026-10-22T08:00:00Z",
};

describe("EditTaskForm", () => {
  it("submits only the changed name, trimming surrounding spaces", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EditTaskForm task={task} onSubmit={onSubmit} />);

    const name = screen.getByPlaceholderText("Название задачи");

    await user.clear(name);
    await user.type(name, "  Отчёт за неделю ");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Отчёт за неделю" });
  });

  it("sends a cleared description as null — the description is removed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<EditTaskForm task={task} onSubmit={onSubmit} />);
    await user.clear(screen.getByPlaceholderText("Описание задачи"));
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSubmit).toHaveBeenCalledWith({ description: null });
  });

  it("does not save without a name", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<EditTaskForm task={task} onSubmit={onSubmit} />);
    await user.clear(screen.getByPlaceholderText("Название задачи"));

    expect(await screen.findByText("Заполните поле")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
