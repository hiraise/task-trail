import { createSelector } from "@reduxjs/toolkit/react";

import { RootState } from "@/infrastructure/redux/store";
import { users as mockUsers } from "@/presentation/widgets/projects/MembersList/MembersList.mock";
import { mockProjects } from "@/presentation/widgets/tasks/ProjectsList/ProjectsList.mock";
import { Project, ProjectMember } from "@/domain/project/project.entity";

export const selectTask = createSelector(
  (state: RootState) => state.task,
  (task) => task
);

const selectMemberById = createSelector(
  (state: RootState) => state.project.members,
  (_: RootState, memberId?: number) => memberId,
  (members, memberId): Partial<ProjectMember> => {
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      console.warn(`Assignee username not found for memberId ${memberId}.`);
      return {};
    }
    return { id: member.id, username: member.username, email: member.email };
  }
);

const selectProjectById = createSelector(
  (state: RootState) => state.projects,
  (state: RootState) => state.project.project,
  (_: RootState, projectId: number | undefined) => projectId,
  (projects, currentProject, projectId): Partial<Project> => {
    if (!projectId && currentProject) {
      return { id: currentProject.id, name: currentProject.name };
    }
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      console.warn(`Project not found for projectId ${projectId}.`);
      return {};
    }
    return { id: project.id, name: project.name };
  }
);

export const selectMemberAndProject = createSelector(
  [
    (state: RootState) => state,
    (_: RootState, assigneeId?: number) => assigneeId,
    (_: RootState, __: number | undefined, projectId?: number) => projectId,
  ],
  (state, assigneeId, projectId) => ({
    member: selectMemberById(state, assigneeId),
    project: selectProjectById(state, projectId),
  })
);

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
