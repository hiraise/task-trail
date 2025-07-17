import { Metadata } from "next";

import { metadataTexts } from "@/shared/locales/metadata";
import { ProjectsSheetManager } from "../../presentation/widgets/projects/ProjectsSheetManager";

export const metadata: Metadata = {
  title: metadataTexts.projects.title,
  description: metadataTexts.projects.description,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProjectsSheetManager />
      {children}
    </>
  );
}
