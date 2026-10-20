export const ROUTES = {
  main: "/",
  login: "/auth",
  authConfirm: "/auth/confirm",
  signUp: "/auth/signup",
  signUpConfirm: "/auth/signup/confirm",
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
} as const;

export const BOTTOM_NAV_PATHS = [
  ROUTES.projects,
  ROUTES.boards,
  ROUTES.tasks,
  ROUTES.profile,
] as const;
