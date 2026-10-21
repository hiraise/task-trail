import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { VerifyEmailPage } from "@/presentation/features/auth/pages";

const searchSchema = z.object({
  token: z.string().optional(),
  email: z.email().optional(),
});

export const Route = createFileRoute("/auth/confirm")({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
});
