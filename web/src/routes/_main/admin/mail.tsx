import { createFileRoute } from "@tanstack/react-router";

import { AdminMailPage } from "@/presentation/features/admin/pages";

export const Route = createFileRoute("/_main/admin/mail")({
  component: AdminMailPage,
});
