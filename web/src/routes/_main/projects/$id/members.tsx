import { createFileRoute } from "@tanstack/react-router";

import { ProjectMembersPage } from "@/presentation/features/projects/pages";

export const Route = createFileRoute("/_main/projects/$id/members")({
  component: ProjectMembersPage,
});
