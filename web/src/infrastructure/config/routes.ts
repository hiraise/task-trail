const PROFILE_BASE = "/profile";
const PROJECTS = "/projects";
const TASKS = "/tasks";

export const ROUTES = {
  login: "/",
  signUp: "/signup",
  dashboard: "/dashboard",
  projects: PROJECTS,
  boards: "/boards",
  tasks: TASKS,
  archive: "/archive",
  confirm: "/confirm",
  passwordRecovery: "/password-recovery",
  profile: PROFILE_BASE,
  profileEditPersonalData: `${PROFILE_BASE}/edit-personal-data`,
  profileChangePassword: `${PROFILE_BASE}/change-password`,
  project: (id: number) => `${PROJECTS}/${id}`,
  projectMembers: (id: number) => `${PROJECTS}/${id}/members`,
  projectTasks: (id: number) => `${PROJECTS}/${id}/tasks`,
  editProject: (id: number) => `${PROJECTS}/${id}/edit-project`,
  task: (id: number) => `${TASKS}/${id}`,
};

export const protectedRoutes = [
  ROUTES.dashboard,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.archive,
  ROUTES.profile,
];
