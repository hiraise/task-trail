import type { Board } from "@/domain/models/Board";
import type { Task } from "@/domain/models/Task";
import type { User } from "@/domain/models/User";
import type { ProjectId, TaskStatusId, UserId } from "@/domain/types";

// The kanban of a board (ADR-0029): columns are statuses, swimlanes are board members and
// the "no assignee" lane. Cards are ordered by update time, newest first: there is no manual order.

/** The key of the "no assignee" swimlane */
export const NO_ASSIGNEE = "none";

export interface Lane {
  /** A board member's ID or NO_ASSIGNEE */
  key: string;
  /** undefined — the "no assignee" lane */
  user?: User;
}

/** A cell of the kanban: a column and, on a board with swimlanes, a lane. */
export interface Cell {
  statusId: TaskStatusId;
  /** undefined — a board without swimlanes: the drop keeps the assignee */
  laneKey?: string;
}

/**
 * Swimlanes: members (the owner first, as the server sends them), then the "no assignee" lane.
 * A board with one member has no swimlanes (frame 980:35751) — undefined.
 */
export function buildLanes(board: Board): Lane[] | undefined {
  if (board.members.length <= 1) return undefined;

  return [...board.members.map((user) => ({ key: user.id, user })), { key: NO_ASSIGNEE }];
}

export const laneKeyOf = (task: Task): string => task.assigneeId ?? NO_ASSIGNEE;

/** The task is in the cell; on a board without swimlanes only the column counts. */
export const isInCell = (task: Task, cell: Cell): boolean =>
  task.statusId === cell.statusId && (cell.laneKey === undefined || laneKeyOf(task) === cell.laneKey);

/** The task as it looks after a drop into the cell. */
export function moveToCell(task: Task, cell: Cell): Task {
  if (cell.laneKey === undefined) return { ...task, statusId: cell.statusId };

  return {
    ...task,
    statusId: cell.statusId,
    assigneeId: cell.laneKey === NO_ASSIGNEE ? undefined : cell.laneKey,
  };
}

/**
 * The task may go into the lane: the assignee must be a member of the task's project
 * (ASSIGNEE_NOT_MEMBER otherwise). The "no assignee" lane and a board without lanes take any task.
 * While the project members are loading, the lane is not offered.
 */
export function canDropInLane(
  task: Task,
  laneKey: string | undefined,
  membersByProject: ReadonlyMap<ProjectId, ReadonlySet<UserId>>,
): boolean {
  if (laneKey === undefined || laneKey === NO_ASSIGNEE || laneKey === task.assigneeId) return true;

  return membersByProject.get(task.projectId)?.has(laneKey) ?? false;
}

/**
 * Tasks in the order of the server (newest first) with the moved ones on top: a move updates
 * the task, so after the refetch it is the newest one anyway.
 */
export function applyMoves(tasks: Task[], moves: ReadonlyMap<string, Task>): Task[] {
  if (moves.size === 0) return tasks;
  const moved = tasks.filter((task) => moves.has(task.id)).map((task) => moves.get(task.id)!);

  return [...moved, ...tasks.filter((task) => !moves.has(task.id))];
}
