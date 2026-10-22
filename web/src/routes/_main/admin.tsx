import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminGuard } from "@/presentation/features/admin/components";

// Service admin section (ADR-0014): without rights — redirect to the profile
export const Route = createFileRoute("/_main/admin")({
  component: () => (
    <AdminGuard>
      <Outlet />
    </AdminGuard>
  ),
});
