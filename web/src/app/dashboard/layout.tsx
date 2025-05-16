import { Metadata } from "next";

import { metadataTexts } from "@/shared/locales/metadata";

export const metadata: Metadata = {
  title: metadataTexts.dashboard.title,
  description: metadataTexts.dashboard.description,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
