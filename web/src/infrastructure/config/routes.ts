const PROFILE_BASE = "/profile";
const PROJECTS = "/projects";

export const ROUTES = {
  login: "/",
  signUp: "/signup",
  dashboard: "/dashboard",
  projects: PROJECTS,
  boards: "/boards",
  tasks: "/tasks",
  archive: "/archive",
  confirm: "/confirm",
  passwordRecovery: "/password-recovery",
  profile: PROFILE_BASE,
  profileEditPersonalData: `${PROFILE_BASE}/edit-personal-data`,
  profileChangePassword: `${PROFILE_BASE}/change-password`,
  project: (id: string) => `${PROJECTS}/${id}`,
  projectMembers: (id: string) => `${PROJECTS}/${id}/members`,
  projectTasks: (id: string) => `${PROJECTS}/${id}/tasks`,
  editProject: (id: string) => `${PROJECTS}/${id}/edit-project`,
};

export const protectedRoutes = [
  ROUTES.dashboard,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.archive,
  ROUTES.profile,
];
