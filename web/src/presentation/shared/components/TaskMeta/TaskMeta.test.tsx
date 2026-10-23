import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Task } from "@/domain/models/Task";

import { TaskMeta } from "./TaskMeta";

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
});
