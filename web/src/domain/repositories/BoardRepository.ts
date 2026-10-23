import type { Board } from "../models/Board";
import type { Task } from "../models/Task";
import type { BoardId, ProjectId, UserId } from "../types";

export interface NewBoard {
  name: string;
  /** 1–50 projects where the current user is a member */
  projectIds: ProjectId[];
  /** Up to 50 people who share a project with the current user */
  memberIds: UserId[];
}

/** Boards (ADR-0029). The owner changes the board; a member views it and can leave. */
export interface BoardRepository {
  /** Boards where the current user is a member, newest first */
  findAll(): Promise<Board[]>;
  findById(id: BoardId): Promise<Board>;
  create(board: NewBoard): Promise<Board>;
  rename(id: BoardId, name: string): Promise<Board>;
  /** Replaces the board projects the owner sees; the others stay */
  setProjects(id: BoardId, projectIds: ProjectId[]): Promise<Board>;
  addMembers(id: BoardId, userIds: UserId[]): Promise<Board>;
  removeMember(id: BoardId, userId: UserId): Promise<void>;
  leave(id: BoardId): Promise<void>;
  delete(id: BoardId): Promise<void>;
  /** Board tasks the current user sees, recently updated first */
  findTasks(id: BoardId): Promise<Task[]>;
}
