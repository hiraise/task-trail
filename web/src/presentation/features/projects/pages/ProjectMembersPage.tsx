import { useParams } from "@tanstack/react-router";

import type { ProjectId } from "@/domain/types";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";
import { canInviteMembers } from "@/shared/utils/userRole";

import { MemberGroups } from "../components";
import { useAddMembers, useProject, useProjectMembers } from "../hooks";

/** Участники проекта — страница телефона; шире участники показаны на странице проекта. */
export function ProjectMembersPage() {
  const { id: projectId } = useParams({ from: "/_main/projects/$id/members" });

  return (
    <DeviceBased
      desktop={<RedirectScreen href={`/projects/${projectId}`} />}
      mobile={<MembersScreen projectId={projectId} />}
    />
  );
}

function MembersScreen({ projectId }: { projectId: ProjectId }) {
  const { data: project } = useProject(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const { mutate: addMembers } = useAddMembers();
  const { showInviteUser } = useGlobalModals();
  const canInvite = project ? canInviteMembers(project.role) : false;

  const handleAddMembers = async () => {
    const emails = await showInviteUser({ projectId });

    if (emails && emails.length > 0) addMembers({ projectId, emails });
  };

  return (
    <PagesMobileTemplate
      topBarBackTitle={TEXTS.projects.members}
      variant={canInvite ? "addUser" : "none"}
      onActionClick={handleAddMembers}
    >
      <MemberGroups members={members} projectId={projectId} />
    </PagesMobileTemplate>
  );
}
