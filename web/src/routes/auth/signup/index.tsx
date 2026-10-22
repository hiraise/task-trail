import { createFileRoute, redirect } from "@tanstack/react-router";

import { publicSettingsQuery } from "@/presentation/features/auth/hooks";
import { SignupPage } from "@/presentation/features/auth/pages";
import { ROUTES } from "@/shared/config/routes";

import { queryClient } from "../../__root";

export const Route = createFileRoute("/auth/signup/")({
  // Sign-up is open only while the service has no users (ADR-0016)
  beforeLoad: async () => {
    const settings = await queryClient.ensureQueryData(publicSettingsQuery);

    if (!settings.registrationOpen) {
      throw redirect({ to: ROUTES.login, replace: true });
    }
  },
  component: SignupPage,
});
