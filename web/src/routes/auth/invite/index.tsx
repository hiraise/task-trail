import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { InvitePage } from "@/presentation/features/auth/pages";

// Invitation token from the link `<service address>/auth/invite?token=…`; it goes to the API in the body
const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth/invite/")({
  validateSearch: searchSchema,
  component: InvitePage,
});
