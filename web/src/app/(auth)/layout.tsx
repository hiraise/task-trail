import { Metadata } from "next";

import { metadataTexts } from "@/shared/locales/metadata";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { AuthDesktopTemplate } from "@/presentation/templates";

export const metadata: Metadata = {
  title: metadataTexts.login.title,
  description: metadataTexts.login.description,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceBased
      mobile={children}
      desktop={<AuthDesktopTemplate>{children}</AuthDesktopTemplate>}
    />
  );
}
