export const ROUTES = {
  login: "/",
  signUp: "/signup",
  emailConfirm: "/email-confirm",
  dashboard: "/dashboard",
  projects: "/projects",
  boards: "/boards",
  tasks: "/tasks",
  archive: "/archive",
};

export const protectedRoutes = [
  ROUTES.dashboard,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.archive,
];
