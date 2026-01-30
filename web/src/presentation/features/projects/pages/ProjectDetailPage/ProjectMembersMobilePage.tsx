import { useParams } from "next/navigation";

import { isProjectMemberAdmin, isProjectMemberOwner } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

import { MembersList } from "../../components";
import { useAddMember, useProjectMembers } from "../../hooks";

export function ProjectMembersMobilePage() {
  const params = useParams();
  const projectId = params.id as ProjectId;

  const { showInviteUser } = useGlobalModals();
  const { mutateAsync: addMembers } = useAddMember();
  const { data: members = [] } = useProjectMembers(projectId);

  const admins = members.filter((m) => isProjectMemberAdmin(m) || isProjectMemberOwner(m));
  const displayMembers = members.filter(
    (m) => !isProjectMemberAdmin(m) && !isProjectMemberOwner(m),
  );

  const handleAddMembers = async () => {
    const emails = await showInviteUser();

    if (!emails || emails.length === 0) return;
    await addMembers({ projectId, emails });
  };

  return (
    <PagesMobileTemplate
      topBarBackTitle={TEXTS.projects.members}
      variant="addUser"
      onActionClick={handleAddMembers}
    >
      <MembersList group="admins" members={admins} />
      <MembersList group="members" members={displayMembers} />
    </PagesMobileTemplate>
  );
}
