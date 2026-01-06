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
  project: (id: number) => `${PROJECTS}/${id}`,
  projectMembers: (id: number) => `${PROJECTS}/${id}/members`,
  projectTasks: (id: number) => `${PROJECTS}/${id}/tasks`,
  projectTask: (id: number, taskId: number) => `${PROJECTS}/${id}/tasks/${taskId}`,
  editProject: (id: number) => `${PROJECTS}/${id}/edit-project`,
  task: (id: number) => `${TASKS}/${id}`,
  board: (id: number) => `${BOARDS}/${id}`,
};

export const protectedRoutes = [
  ROUTES.search,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.profile,
];

export const BOTTOM_NAV_PATHS = [ROUTES.projects, ROUTES.boards, ROUTES.tasks, ROUTES.profile];
