export const ROUTES = {
  main: "/",
  login: "/auth",
  signUp: "/auth/signup",
  invite: "/auth/invite",
  passwordRecovery: "/auth/password-recovery",
  passwordRecoveryConfirm: "/auth/password-recovery/confirm",
  authReset: "/auth/reset",
  search: "/search",
  projects: "/projects",
  boards: "/boards",
  tasks: "/tasks",
  profile: "/profile",
  profileEditPersonalData: "/profile/edit-personal-data",
  profileChangePassword: "/profile/change-password",
  admin: "/admin",
  adminServiceUrl: "/admin/service-url",
  adminMail: "/admin/mail",
  adminUsers: "/admin/users",
} as const;

export const BOTTOM_NAV_PATHS = [
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.profile,
] as const;
