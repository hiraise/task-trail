import { Navigate } from "@tanstack/react-router";

import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { ROUTES } from "@/shared/config/routes";

/**
 * Раздел только администратору сервиса (ADR-0014): сервер проверяет права в каждом запросе,
 * веб прячет раздел. Снял права с себя — уходим в профиль, иначе запросы получат 403.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetCurrentUser();

  if (!user) return null;
  if (!user.isAdmin) return <Navigate to={ROUTES.profile} replace />;

  return <>{children}</>;
}
