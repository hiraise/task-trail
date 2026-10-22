import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminGuard } from "@/presentation/features/admin/components";

// Раздел администратора сервиса (ADR-0014): без прав — в профиль
export const Route = createFileRoute("/_main/admin")({
  component: () => (
    <AdminGuard>
      <Outlet />
    </AdminGuard>
  ),
});
