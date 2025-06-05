export const ROUTES = {
  login: "/",
  signUp: "/signup",
  dashboard: "/dashboard",
  projects: "/projects",
  boards: "/boards",
  tasks: "/tasks",
  archive: "/archive",
  confirm: "/confirm",
};

export const protectedRoutes = [
  ROUTES.dashboard,
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.archive,
];
