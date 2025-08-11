"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import "./styles.css";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BackButton } from "@/presentation/ui/BackButton";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { MembersList } from "@/presentation/widgets/projects/MembersList";
import { useModalSheet } from "@/application/projects/hooks/useModalSheet";
import { useProjects } from "@/application/projects/hooks/useProjects";
import { useAppSelector } from "@/infrastructure/redux/hooks";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";

const texts = {
  title: "Участники проекта",
};

export default function ProjectMembersPage() {
  const project = useAppSelector((state) => state.project.project);
  const members = useAppSelector((state) => state.project.members);

  const { showInviteUser } = useModalSheet();
  const { isLoading, getMembers, addMembers } = useProjects();

  useEffect(() => {
    async function fetchMembers() {
      if (!project) return;
      await getMembers(project.id);
    }
    fetchMembers();
  }, [getMembers, project]);

  const handleAddMembers = async (data: string[]) => {
    try {
      if (!project) return;
      await addMembers(project.id, data);
      toast.success("User invited successfully!");
    } catch (error) {
      console.error("Failed to invite user:", error);
      toast.error("Failed to invite user");
    }
  };

  function handleAddMember() {
    showInviteUser({ onSubmit: handleAddMembers });
  }

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
            <IconButton icon={ICONS.addUser} size="24px" onClick={handleAddMember} />
          </div>
        </div>
        {isLoading && <LoadingScreen />}
        <div className="users-list">
          <MembersList members={members} />
        </div>
      </div>
    </MainContainer>
  );
}
