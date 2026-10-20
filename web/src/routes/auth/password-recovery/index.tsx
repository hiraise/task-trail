import { createFileRoute } from "@tanstack/react-router";

import { PasswordRecoveryPage } from "@/presentation/features/auth/pages";

export const Route = createFileRoute("/auth/password-recovery/")({
  component: PasswordRecoveryPage,
});
