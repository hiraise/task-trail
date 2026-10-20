import { createFileRoute } from "@tanstack/react-router";

import { BoardsPage } from "@/presentation/features/boards/pages";

export const Route = createFileRoute("/_main/boards/")({
  component: BoardsPage,
});
