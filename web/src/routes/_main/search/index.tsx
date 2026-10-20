import { createFileRoute } from "@tanstack/react-router";

import { SearchPage } from "@/presentation/shared";

export const Route = createFileRoute("/_main/search/")({
  component: SearchPage,
});
