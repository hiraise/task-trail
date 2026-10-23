import { createFileRoute } from "@tanstack/react-router";

import { BoardMembersPage } from "@/presentation/features/boards/pages";

export const Route = createFileRoute("/_main/boards/$id/members")({
  component: BoardMembersPage,
});
