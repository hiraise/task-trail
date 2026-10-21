import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { DeviceBased } from "@/presentation/shared";
import { AuthDesktopTemplate, AuthMobileTemplate } from "@/presentation/shared/components/Layout";
import { checkAuthStatusUseCase } from "@/application/usecases";
import { queryClient } from "./__root";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { ROUTES } from "@/shared/config/routes";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    // Check if user is already authenticated
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

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceBased
      mobile={<AuthMobileTemplate>{children}</AuthMobileTemplate>}
      desktop={<AuthDesktopTemplate>{children}</AuthDesktopTemplate>}
    />
  );
}
