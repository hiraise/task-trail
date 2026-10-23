import type { Board } from "@/domain/models/Board";
import type { Task } from "@/domain/models/Task";
import type { User } from "@/domain/models/User";

import { NO_ASSIGNEE, applyMoves, buildLanes, canDropInLane, isInCell, moveToCell } from "./kanban";

const anna: User = { id: "anna", email: "anna@example.com", username: "Анна" };
const ivan: User = { id: "ivan", email: "ivan@example.com", username: "Иван" };

const board = (members: User[]): Board => ({
  id: "b",
  name: "Релиз",
  ownerId: "anna",
  createdAt: "2026-10-23T12:00:00Z",
  updatedAt: "2026-10-23T12:00:00Z",
  projects: [],
  members,
  tasksCount: 0,
});

const task = (id: string, fields: Partial<Task> = {}): Task => ({
  id,
  projectId: "design",
  number: 1,
  key: "DS-1",
  name: id,
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

describe("buildLanes", () => {
  it("lists members in the server order, then «Без ответственного»", () => {
    expect(buildLanes(board([anna, ivan]))?.map((lane) => lane.key)).toEqual(["anna", "ivan", NO_ASSIGNEE]);
  });

  it("gives a board with one member no swimlanes", () => {
    expect(buildLanes(board([anna]))).toBeUndefined();
  });
});

describe("cells", () => {
  it("puts a task by status and assignee; without lanes only the status counts", () => {
    const unassigned = task("t");

    expect(isInCell(unassigned, { statusId: "open", laneKey: NO_ASSIGNEE })).toBe(true);
    expect(isInCell(unassigned, { statusId: "open", laneKey: "anna" })).toBe(false);
    expect(isInCell(task("t", { assigneeId: "anna" }), { statusId: "open" })).toBe(true);
  });

  it("moves a task: the lane sets the assignee, a board without lanes keeps it", () => {
    const assigned = task("t", { assigneeId: "anna" });

    expect(moveToCell(assigned, { statusId: "done", laneKey: NO_ASSIGNEE })).toMatchObject({
      statusId: "done",
      assigneeId: undefined,
    });
    expect(moveToCell(task("t"), { statusId: "open", laneKey: "ivan" }).assigneeId).toBe("ivan");
    expect(moveToCell(assigned, { statusId: "done" })).toMatchObject({ statusId: "done", assigneeId: "anna" });
  });
});

describe("canDropInLane", () => {
  const members = new Map([["design", new Set(["anna"])]]);

  it("takes a member of the task's project, «Без ответственного» and a board without lanes", () => {
    expect(canDropInLane(task("t"), "anna", members)).toBe(true);
    expect(canDropInLane(task("t"), NO_ASSIGNEE, members)).toBe(true);
    expect(canDropInLane(task("t"), undefined, members)).toBe(true);
  });

  it("refuses a non-member and a project whose members are not loaded yet", () => {
    expect(canDropInLane(task("t"), "ivan", members)).toBe(false);
    expect(canDropInLane(task("t", { projectId: "backend" }), "anna", members)).toBe(false);
  });
});

describe("applyMoves", () => {
  it("puts moved tasks on top and keeps the server order of the rest", () => {
    const tasks = [task("a"), task("b"), task("c")];
    const moved = moveToCell(tasks[2], { statusId: "done" });

    expect(applyMoves(tasks, new Map([["c", moved]]))).toEqual([moved, tasks[0], tasks[1]]);
    expect(applyMoves(tasks, new Map())).toBe(tasks);
  });
});
