import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/presentation/features/user/pages";

export const Route = createFileRoute("/_main/profile/")({
  component: ProfilePage,
});
