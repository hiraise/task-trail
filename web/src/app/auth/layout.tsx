import { Metadata } from "next";

import { metadataTexts } from "@/shared/locales/metadata";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { AuthDesktopTemplate, AuthMobileTemplate } from "@/presentation/templates";

export const metadata: Metadata = {
  title: metadataTexts.login.title,
  description: metadataTexts.login.description,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceBased
      mobile={<AuthMobileTemplate>{children}</AuthMobileTemplate>}
      desktop={<AuthDesktopTemplate>{children}</AuthDesktopTemplate>}
    />
  );
}
