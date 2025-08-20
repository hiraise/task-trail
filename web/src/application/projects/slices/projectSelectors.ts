import { createSelector } from "@reduxjs/toolkit/react";

import { RootState } from "@/infrastructure/redux/store";
import { Project, ProjectMember } from "@/domain/project/project.entity";
import { Task } from "@/domain/task/task.entity";

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

interface ProjectTasks {
  projectId: number | undefined;
  tasks: Task[];
}

export const selectProjectTasks = createSelector(
  (state: RootState) => state.project,
  (projectState): ProjectTasks => ({
    projectId: projectState.project?.id,
    tasks: projectState.tasks,
  })
);
