import type { BoardId, ProjectId, TaskId } from "../../domain/types";

const PROFILE_BASE = "/profile";
const PROJECTS = "/projects";
const TASKS = "/tasks";
const BOARDS = "/boards";
const AUTH = "/auth";

export const ROUTES = {
  main: "/",
  login: `${AUTH}`,
  signUp: `${AUTH}/signup`,
  signUpConfirm: (email: string) => `${AUTH}/signup/confirm/?email=${email}`,
  confirm: `${AUTH}/confirm`,
  passwordRecovery: `${AUTH}/password-recovery`,
  passwordRecoveryConfirm: (email: string) => `${AUTH}/password-recovery/confirm/?email=${email}`,
  search: "/search",
  projects: PROJECTS,
  boards: BOARDS,
  tasks: TASKS,
  profile: PROFILE_BASE,
  profileEditPersonalData: `${PROFILE_BASE}/edit-personal-data`,
  profileChangePassword: `${PROFILE_BASE}/change-password`,
  project: (id: ProjectId) => `${PROJECTS}/${id}`,
  projectMembers: (id: ProjectId) => `${PROJECTS}/${id}/members`,
  projectTasks: (id: ProjectId) => `${PROJECTS}/${id}/tasks`,
  projectTask: (id: ProjectId, taskId: TaskId) => `${PROJECTS}/${id}/tasks/${taskId}`,
  task: (id: TaskId) => `${TASKS}/${id}`,
  board: (id: BoardId) => `${BOARDS}/${id}`,
};

export const protectedRoutes = [
  ROUTES.search,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.profile,
];

export const BOTTOM_NAV_PATHS = [ROUTES.projects, ROUTES.boards, ROUTES.tasks, ROUTES.profile];
