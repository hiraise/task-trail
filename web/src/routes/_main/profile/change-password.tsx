import { createFileRoute } from "@tanstack/react-router";

import { ChangePasswordPage } from "@/presentation/features/user/pages";

export const Route = createFileRoute("/_main/profile/change-password")({
  component: ChangePasswordPage,
});
