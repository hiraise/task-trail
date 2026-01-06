import type { Metadata } from "next";

import { DeviceBased } from "@/presentation/shared";
import { AuthDesktopTemplate, AuthMobileTemplate } from "@/presentation/shared/components/Layout";
import { metadataTexts } from "@/shared/locales/metadata";

export const metadata: Metadata = {
  title: metadataTexts.login.title,
  description: metadataTexts.login.description,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceBased
      mobile={<AuthMobileTemplate>{children}</AuthMobileTemplate>}
      desktop={<AuthDesktopTemplate>{children}</AuthDesktopTemplate>}
    />
  );
}
