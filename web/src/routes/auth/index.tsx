import { LoginPage } from "@/presentation/features/auth/pages";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Validates the `from` search parameter passed by the auth guard when
 * redirecting an unauthenticated user to the login page.
 */
const searchSchema = z.object({
  from: z.string().optional(),
});

export const Route = createFileRoute("/auth/")({
  validateSearch: searchSchema,
  component: LoginPage,
});
