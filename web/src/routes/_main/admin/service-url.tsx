import { createFileRoute } from "@tanstack/react-router";

import { AdminServiceUrlPage } from "@/presentation/features/admin/pages";

export const Route = createFileRoute("/_main/admin/service-url")({
  component: AdminServiceUrlPage,
});
