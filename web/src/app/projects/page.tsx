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
};

export default function ProjectsPage() {
  const mockData = mockProjects;
  return (
    <MainContainer>
      <DashboardHeader />
      <div className="title-container">
        <h1>{projectTexts.title}</h1>
        <IconButton
          icon={ICONS.sort}
          onClick={() => toast.success("Sorting")}
        />
      </div>
      <div className="cards-container">
        {/* TODO: replace with real data */}
        {Array.from({ length: mockProjects.length }).map((_, index) => (
          <ProjectCard key={index} project={mockData[index] || {}} />
        ))}
      </div>
      <div className="floating-button">
        <IconButton icon={ICONS.addButton} />
      </div>
      <BottomNavBar />
    </MainContainer>
  );
}
