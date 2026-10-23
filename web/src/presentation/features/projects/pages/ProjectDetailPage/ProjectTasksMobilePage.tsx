import { useParams } from "@tanstack/react-router";

import { isProjectArchived } from "@/domain/models/Project";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useProjectMembers } from "@/presentation/shared/hooks";
import { TEXTS } from "@/shared/locales/texts";

import { FloatingButton, ProjectTaskTabs } from "../../components";
import { useProject } from "../../hooks";

/** Project tasks — a phone page with tabs and sorting; an archived project has no "Create task". */
export function ProjectTasksMobilePage() {
  const { id: projectId } = useParams({ from: "/_main/projects/$id/tasks/" });
  const { data: project } = useProject(projectId);
  const { data: members = [] } = useProjectMembers(projectId);

  if (!project) return null;

  const archived = isProjectArchived(project);

  return (
    <>
      <PagesMobileTemplate topBarBackTitle={TEXTS.projects.tasks}>
        <ProjectTaskTabs projectId={projectId} members={members} projectArchived={archived} />
      </PagesMobileTemplate>
      {!archived && <FloatingButton projectId={projectId} />}
    </>
  );
}
