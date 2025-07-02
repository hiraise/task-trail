"use client";

import { toast } from "sonner";

import "./styles.css";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { DashboardHeader } from "@/presentation/widgets/dashboard/Header";
import MainContainer from "@/presentation/widgets/primitives/MainContainer";
import {
  mockProjects,
  ProjectCard,
} from "@/presentation/widgets/projects/ProjectCard";

const projectTexts = {
  title: "Мои проекты",
  noProjects: "Нет проектов",
  createFirstProject: "Создайте свой первый проект!",
};

export default function ProjectsPage() {
  return (
    <MainContainer>
      <DashboardHeader />
      <div className="title-container">
        <h1>{projectTexts.title}</h1>
        <IconButton icon={ICONS.sort} onClick={() => toast.info("Sorting")} />
      </div>

      {mockProjects.length === 0 && (
        <div className="empty-state">
          <h2>{projectTexts.noProjects}</h2>
          <p>{projectTexts.createFirstProject}</p>
        </div>
      )}

      <div className="cards-container">
        {/* TODO: replace with real data */}
        {mockProjects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
      <div className="floating-button">
        <IconButton
          icon={ICONS.addButton}
          onClick={() => toast.info("Create new project")}
        />
      </div>
      <BottomNavBar />
    </MainContainer>
  );
}
