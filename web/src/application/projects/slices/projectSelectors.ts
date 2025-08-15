import { createSelector } from "@reduxjs/toolkit/react";

import { RootState } from "@/infrastructure/redux/store";
import { Project, ProjectMember } from "@/domain/project/project.entity";

interface ProjectData {
  project: Project | null;
  owner: string;
  isLoading: boolean;
  members: ProjectMember[];
}

export const selectProjectData = createSelector(
  (state: RootState) => state.project,
  (projectState): ProjectData => ({
    project: projectState.project,
    owner: projectState.members.find((m) => m.isOwner)?.username || "Unknown",
    isLoading: projectState.isLoading,
    members: projectState.members,
  })
);
