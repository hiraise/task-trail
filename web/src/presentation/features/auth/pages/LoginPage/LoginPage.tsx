import { useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { errorTexts } from "@/shared/locales/messages";
import { DeviceBased } from "@/presentation/shared";

import { LoginDesktopPage } from "./LoginDesktopPage";
import { LoginMobilePage } from "./LoginMobilePage";

/**
 * Login page component.
 *
 * When rendered with a `from` search parameter (i.e. the user was redirected
 * here by the auth guard), shows an error toast informing them that
 * authentication is required. After a successful login, `useLogin` reads this
 * parameter and navigates the user back to the originally requested page.
 */
export function LoginPage() {
  const { from } = useSearch({ from: "/auth/" });

  useEffect(() => {
    if (from) toast.error(errorTexts.authenticationRequired);
  }, [from]);

  return <DeviceBased desktop={<LoginDesktopPage />} mobile={<LoginMobilePage />} />;
}
