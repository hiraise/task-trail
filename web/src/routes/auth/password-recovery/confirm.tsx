import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { PasswordRecoveryConfirmPage } from "@/presentation/features/auth/pages";

const searchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/auth/password-recovery/confirm")({
  component: PasswordRecoveryConfirmPage,
  validateSearch: searchSchema,
});
