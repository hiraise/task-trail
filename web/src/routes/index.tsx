import { createFileRoute, redirect } from "@tanstack/react-router";
import { ROUTES } from "@/shared/config/routes";

/**
 * Root route (`/`).
 *
 * A public redirect entry point that immediately forwards the user to the
 * projects page. Placing this outside the `_main` layout ensures the auth
 * guard never intercepts the root path and avoids passing `from=/` to the
 * login page as a redirect target.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: ROUTES.projects, replace: true });
  },
});
