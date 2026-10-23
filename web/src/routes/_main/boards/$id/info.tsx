import { createFileRoute } from "@tanstack/react-router";

import { BoardInfoPage } from "@/presentation/features/boards/pages";

export const Route = createFileRoute("/_main/boards/$id/info")({
  component: BoardInfoPage,
});
