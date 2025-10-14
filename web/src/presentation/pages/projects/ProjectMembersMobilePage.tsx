import { useParams } from "next/navigation";

import { TEXTS } from "@/shared/locales/texts";
import { MembersList } from "@/presentation/widgets/projects/MembersList";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useAddMember, useGetProjectMembers } from "@/application/projects/hooks/useProject";
import { PagesMobileTemplate } from "@/presentation/templates";

export function ProjectMembersMobilePage() {
  const params = useParams();
  const projectId = Number(params.id);

  const { showInviteUser } = useGlobalModals();
  const { mutateAsync: addMembers } = useAddMember();
  const { data: members = [] } = useGetProjectMembers(projectId);

  const admins = members.filter((m) => m.isAdmin || m.isOwner);
  const displayMembers = members.filter((m) => !m.isAdmin && !m.isOwner);

  const handleAddMembers = async () => {
    const emails = await showInviteUser();
    if (!emails || emails.length === 0) return;
    await addMembers(emails);
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
