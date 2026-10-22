import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { checkAuthStatusUseCase } from "@/application/usecases";
import { AuthLayout } from "@/presentation/shared/components/Layout";
import { ROUTES } from "@/shared/config/routes";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

import { queryClient } from "./__root";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    // Вошедшему экраны доступа не нужны
    const authStatus = await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.auth.session,
      queryFn: checkAuthStatusUseCase,
    });

    if (authStatus.isAuthenticated) {
      throw redirect({ to: ROUTES.projects, replace: true });
    }
  },
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
});
