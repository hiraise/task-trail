const PROFILE_BASE = "/profile";
const PROJECTS = "/projects";
const TASKS = "/tasks";
const BOARDS = "/boards";
const AUTH = "/auth";

export const ROUTES = {
  login: `${AUTH}`,
  signUp: `${AUTH}/signup`,
  confirm: `${AUTH}/confirm`,
  passwordRecovery: `${AUTH}/password-recovery`,
  dashboard: "/dashboard",
  projects: PROJECTS,
  boards: BOARDS,
  tasks: TASKS,
  archive: "/archive",
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
  ROUTES.dashboard,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.archive,
  ROUTES.profile,
];

export const BOTTOM_NAV_PATHS = [ROUTES.projects, ROUTES.boards, ROUTES.tasks, ROUTES.profile];
