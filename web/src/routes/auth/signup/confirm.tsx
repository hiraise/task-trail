import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ConfirmSignupMobilePage } from "@/presentation/features/auth/pages/SignUpPage";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/auth/signup/confirm")({
  component: ConfirmSignupMobilePage,
  validateSearch: searchSchema,
});
