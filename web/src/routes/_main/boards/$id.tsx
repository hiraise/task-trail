import { createFileRoute } from "@tanstack/react-router";

import { BoardPage } from "@/presentation/features/boards/pages";

export const Route = createFileRoute("/_main/boards/$id")({
  component: BoardPage,
});
