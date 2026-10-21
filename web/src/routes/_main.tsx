import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";

import { normalize } from "@/shared/utils/formatters";
import { BOTTOM_NAV_PATHS, ROUTES } from "@/shared/config/routes";
import { DeviceBased } from "@/presentation/shared";
import { BottomNavBar, DesktopTemplate } from "@/presentation/shared/components/Layout";
import { checkAuthStatusUseCase } from "@/application/usecases";
import { queryClient } from "./__root";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";

/**
 * Protected layout route (`/_main`).
 *
 * Acts as an authentication guard for all nested routes. On every navigation:
 * - Fetches (or reuses cached) auth status via `checkAuthStatusUseCase`.
 * - If the user is not authenticated, redirects to the login page and passes
 *   the attempted URL as the `from` search parameter so the user can be
 *   returned there after a successful login.
 *
 * Also renders the responsive app shell (bottom nav bar on mobile,
 * sidebar layout on desktop).
 */
export const Route = createFileRoute("/_main")({
  beforeLoad: async ({ location }) => {
    // Check auth status using queryClient cache
    const authStatus = await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.auth.session,
      queryFn: checkAuthStatusUseCase,
    });

    if (!authStatus.isAuthenticated) {
      throw redirect({
        to: ROUTES.login,
        search: { from: location.href },
        replace: true,
      });
    }
  },
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});

function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const normalizedPathname = normalize(location.pathname);

  const showBottomNavBar = BOTTOM_NAV_PATHS.map(normalize).includes(normalizedPathname);

  return (
    <DeviceBased
      mobile={
        <>
          {children}
          {showBottomNavBar && <BottomNavBar />}
        </>
      }
      desktop={<DesktopTemplate>{children}</DesktopTemplate>}
    />
  );
}
