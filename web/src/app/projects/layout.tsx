import { Metadata } from "next";

import { metadataTexts } from "@/shared/locales/metadata";

export const metadata: Metadata = {
  title: metadataTexts.projects.title,
  description: metadataTexts.projects.description,
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
