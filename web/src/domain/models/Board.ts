import type { BoardId, ProjectId, UserId } from "../types";

import type { User } from "./User";

/** A board project the current user sees: boards show only projects where they are a member (ADR-0029). */
export interface BoardProject {
  id: ProjectId;
  name: string;
  key: string;
  /** ISO 8601 in UTC; undefined when the project is active (ADR-0027) */
  archivedAt?: string;
}

/**
 * A board — a view over tasks of several projects (ADR-0029). Board membership grants no access
 * to tasks: a member sees only the board projects where they are a project member.
 */
export interface Board {
  id: BoardId;
  name: string;
  ownerId: UserId;
  /** ISO 8601 in UTC */
  createdAt: string;
  /** ISO 8601 in UTC */
  updatedAt: string;
  /** By name */
  projects: BoardProject[];
  /** The owner first, the others in order of joining */
  members: User[];
  /** The board tasks the current user sees */
  tasksCount: number;
}

/** Board name: 1–200 characters (contract, BoardName). */
export const BOARD_NAME_MAX_LENGTH = 200;
