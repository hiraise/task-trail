import { Metadata } from "next";

import { metadataTexts } from "@/shared/locales/metadata";

export const metadata: Metadata = {
  title: metadataTexts.signup.title,
  description: metadataTexts.signup.description,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
