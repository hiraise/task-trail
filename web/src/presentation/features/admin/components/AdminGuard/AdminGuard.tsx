import { Navigate } from "@tanstack/react-router";

import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { ROUTES } from "@/shared/config/routes";

/**
 * The section is for the service administrator only (ADR-0014): the server checks rights on every request,
 * the web hides the section. Removed own rights: go to the profile, otherwise requests get 403.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetCurrentUser();

  if (!user) return null;
  if (!user.isAdmin) return <Navigate to={ROUTES.profile} replace />;

  return <>{children}</>;
}
