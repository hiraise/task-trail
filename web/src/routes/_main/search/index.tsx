import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { SearchPage } from "@/presentation/features/search/pages";

/** `q` — the search query: going back from a found item returns to the same results. */
const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/_main/search/")({
  validateSearch: searchSchema,
  component: SearchPage,
});
