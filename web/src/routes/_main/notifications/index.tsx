import { createFileRoute } from "@tanstack/react-router";

import { NotificationsPage } from "@/presentation/features/notifications/pages";

export const Route = createFileRoute("/_main/notifications/")({
  component: NotificationsPage,
});
