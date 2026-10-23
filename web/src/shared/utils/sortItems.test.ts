import { describe, expect, it } from "vitest";

import type { TaskPriorityId } from "@/domain/types";

import { sortItems } from "./sortItems";

const items = [
  { name: "бюджет", createdAt: "2026-10-20T08:00:00Z", updatedAt: "2026-10-23T08:00:00Z" },
  { name: "Ёлка", createdAt: "2026-10-22T08:00:00Z", updatedAt: "2026-10-21T08:00:00Z" },
  { name: "Альфа", createdAt: "2026-10-21T08:00:00Z", updatedAt: "2026-10-22T08:00:00Z" },
  { name: "Яблоко", createdAt: "2026-10-19T08:00:00Z", updatedAt: "2026-10-19T08:00:00Z" },
];
const names = (option: Parameters<typeof sortItems>[1]) =>
  sortItems(items, option).map((item) => item.name);

describe("sortItems", () => {
  it("dates — newest first", () => {
    expect(names("updatedAt")).toEqual(["бюджет", "Альфа", "Ёлка", "Яблоко"]);
    expect(names("createdAt")).toEqual(["Ёлка", "Альфа", "бюджет", "Яблоко"]);
  });

  it("names — Russian alphabet, case-insensitive, Ё after Е", () => {
    expect(names("nameAsc")).toEqual(["Альфа", "бюджет", "Ёлка", "Яблоко"]);
    expect(names("nameDesc")).toEqual(["Яблоко", "Ёлка", "бюджет", "Альфа"]);
  });

  it("priority — the most urgent first, ties newest updated first, no priority last", () => {
    const task = (name: string, updatedAt: string, priority?: TaskPriorityId) => ({
      name,
      createdAt: "2026-10-20T08:00:00Z",
      updatedAt,
      priority,
    });
    const tasks = [
      task("a", "2026-10-20T08:00:00Z", "low"),
      task("b", "2026-10-20T08:00:00Z", "urgent"),
      task("c", "2026-10-21T08:00:00Z"),
      task("d", "2026-10-22T08:00:00Z", "urgent"),
      task("e", "2026-10-20T08:00:00Z", "normal"),
    ];

    expect(sortItems(tasks, "priority").map((task) => task.name)).toEqual(["d", "b", "e", "a", "c"]);
  });

  it("due date — the earliest first, ties newest updated first, no date last", () => {
    const task = (name: string, updatedAt: string, dueDate?: string) => ({
      name,
      createdAt: "2026-10-20T08:00:00Z",
      updatedAt,
      dueDate,
    });
    const tasks = [
      task("a", "2026-10-20T08:00:00Z"),
      task("b", "2026-10-20T08:00:00Z", "2026-11-02"),
      task("c", "2026-10-20T08:00:00Z", "2026-10-30"),
      task("d", "2026-10-22T08:00:00Z", "2026-10-30"),
      task("e", "2026-10-22T08:00:00Z"),
    ];

    expect(sortItems(tasks, "dueDate").map((task) => task.name)).toEqual(["d", "c", "b", "e", "a"]);
  });

  it("does not change the list it got", () => {
    sortItems(items, "nameAsc");
    expect(items[0].name).toBe("бюджет");
  });
});
