import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

import { PasswordResetPage } from "@/presentation/features/auth/pages";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/auth/reset/")({
  component: PasswordResetPage,
  validateSearch: searchSchema,
});
