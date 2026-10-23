import { describe, expect, it } from "vitest";

import type { Task } from "@/domain/models/Task";

import { parentCandidates } from "./parentCandidates";

const task = (id: string, fields: Partial<Task> = {}): Task => ({
  id,
  projectId: "project",
  number: 1,
  key: `DS-${id}`,
  name: `Задача ${id}`,
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

const ids = (tasks: Task[]) => tasks.map((item) => item.id);

describe("parentCandidates", () => {
  const self = task("1");
  const tasks = [
    self,
    task("2"),
    task("3", { parentId: "2" }),
    task("4", { archivedAt: "2026-10-23T12:00:00Z" }),
    task("5", { name: "Релиз 0.3" }),
  ];

  it("skips the task itself, subtasks and archived tasks", () => {
    expect(ids(parentCandidates(tasks, self, ""))).toEqual(["2", "5"]);
  });

  it("matches the key or the name, ignoring case", () => {
    expect(ids(parentCandidates(tasks, self, "ds-2"))).toEqual(["2"]);
    expect(ids(parentCandidates(tasks, self, "релиз"))).toEqual(["5"]);
  });

  it("nothing for a task with subtasks: one level", () => {
    expect(parentCandidates(tasks, { ...self, subtasksTotal: 1 }, "")).toEqual([]);
  });
});
