const PROFILE_BASE = "/profile";

export const ROUTES = {
  login: "/",
  signUp: "/signup",
  dashboard: "/dashboard",
  projects: "/projects",
  boards: "/boards",
  tasks: "/tasks",
  archive: "/archive",
  confirm: "/confirm",
  profile: PROFILE_BASE,
  profileEditPersonalData: `${PROFILE_BASE}/edit-personal-data`,
  profileChangePassword: `${PROFILE_BASE}/change-password`,
};

export const protectedRoutes = [
  ROUTES.dashboard,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.archive,
  ROUTES.profile,
];
