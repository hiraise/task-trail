import { createFileRoute } from "@tanstack/react-router";

import { AdminPage } from "@/presentation/features/admin/pages";

export const Route = createFileRoute("/_main/admin/")({
  component: AdminPage,
});
