import { createSelector } from "@reduxjs/toolkit/react";

import { RootState } from "@/infrastructure/redux/store";
import { users as mockUsers } from "@/presentation/widgets/projects/MembersList/MembersList.mock";
import { mockProjects } from "@/presentation/widgets/tasks/ProjectsList/ProjectsList.mock";

export const selectAssignee = createSelector(
  (state: RootState) => state.task,
  (task): string => {
    const username = mockUsers.find((m) => m.id === task.assigneeId)?.username;
    if (!username) {
      console.warn(`Assignee username not found for task with ID ${task.id}.`);
      return "Unknown User";
    }
    return username;
  }
);

export const selectProject = createSelector(
  (state: RootState) => state.task,
  (task): string => {
    const projectName = mockProjects.find((p) => p.id === task.projectId)?.name;
    if (!projectName) {
      console.warn(`Project name not found for task with ID ${task.id}.`);
      return "No Project Assigned";
    }
    return projectName;
  }
);
