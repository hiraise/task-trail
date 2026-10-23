import type { BoardRepository } from "@/domain/repositories/BoardRepository";

import type {
  AddBoardMembersRequest,
  Board,
  CreateBoardRequest,
  SetBoardProjectsRequest,
  Task,
  UpdateBoardRequest,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

import { toBoard, toTask } from "./mappers";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createBoardRepository = (http: HttpClient): BoardRepository => ({
  findAll: async () => (await http.get<Board[]>(API_ROUTES.BOARDS)).map(toBoard),

  findById: async (id) => toBoard(await http.get<Board>(API_ROUTES.BOARD_BY_ID(id))),

  create: async ({ name, projectIds, memberIds }) => {
    const body: CreateBoardRequest = { name, projectIds, memberIds };

    return toBoard(await http.post<Board>(API_ROUTES.BOARDS, body));
  },

  rename: async (id, name) => {
    const body: UpdateBoardRequest = { name };

    return toBoard(await http.patch<Board>(API_ROUTES.BOARD_BY_ID(id), body));
  },

  setProjects: async (id, projectIds) => {
    const body: SetBoardProjectsRequest = { projectIds };

    return toBoard(await http.put<Board>(API_ROUTES.BOARD_PROJECTS(id), body));
  },

  addMembers: async (id, userIds) => {
    const body: AddBoardMembersRequest = { userIds };

    return toBoard(await http.post<Board>(API_ROUTES.BOARD_MEMBERS(id), body));
  },

  removeMember: async (id, userId) => {
    await http.delete(API_ROUTES.BOARD_MEMBER(id, userId));
  },

  leave: async (id) => {
    await http.delete(API_ROUTES.LEAVE_BOARD(id));
  },

  delete: async (id) => {
    await http.delete(API_ROUTES.BOARD_BY_ID(id));
  },

  findTasks: async (id) => (await http.get<Task[]>(API_ROUTES.BOARD_TASKS(id))).map(toTask),
});

export const boardRepository: BoardRepository = createBoardRepository(axiosClient);
