import { createFileRoute } from "@tanstack/react-router";

import { AdminUsersPage } from "@/presentation/features/admin/pages";

export const Route = createFileRoute("/_main/admin/users")({
  component: AdminUsersPage,
});
