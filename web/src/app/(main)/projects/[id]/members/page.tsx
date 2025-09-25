"use client";

import { useParams } from "next/navigation";

import "./styles.css";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BackButton } from "@/presentation/ui/BackButton";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { MembersList } from "@/presentation/widgets/projects/MembersList";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { useAddMember, useGetProjectMembers } from "@/application/projects/hooks/useProject";

const texts = {
  title: "Участники проекта",
};

export default function ProjectMembersPage() {
  const params = useParams();
  const projectId = Number(params.id);

  const { showInviteUser } = useGlobalModals();
  const { mutateAsync: addMembers } = useAddMember();
  const { data: members = [] } = useGetProjectMembers(projectId);

  const handleAddMembers = async () => {
    const emails = await showInviteUser();
    if (!emails || emails.length === 0) return;
    await addMembers(emails);
  };

  return (
    <MainContainer>
      <DashboardHeader />
      <div className="container">
        <BackButton />
      </div>
      <div className="content">
        <div className="title-wrapper">
          <div className="members-title">
            <h1>{texts.title}</h1>
            <IconButton icon={ICONS.addUser} size="24px" onClick={handleAddMembers} />
          </div>
        </div>
        <div className="users-list">
          <MembersList members={members} />
        </div>
      </div>
    </MainContainer>
  );
}
