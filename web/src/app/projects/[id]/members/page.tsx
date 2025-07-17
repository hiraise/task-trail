"use client";

import "./styles.css";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import { BackButton } from "@/presentation/ui/BackButton";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { MembersList } from "@/presentation/widgets/projects/MembersList";

const texts = {
  title: "Участники проекта",
};

export default function ProjectMembersPage() {
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
            <IconButton icon={ICONS.addUser} size="24px" />
          </div>
        </div>
        <div className="users-list">
          <MembersList />
        </div>
      </div>
    </MainContainer>
  );
}
