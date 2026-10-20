import { createFileRoute } from "@tanstack/react-router";

import { SignupPage } from "@/presentation/features/auth/pages";

export const Route = createFileRoute("/auth/signup/")({
  component: SignupPage,
});
