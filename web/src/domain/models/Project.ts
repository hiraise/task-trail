import z from "zod";

import type { UserRole } from "@/shared/utils/userRole";
import {
  canArchiveProject,
  canDeleteProject,
  canEditProject,
  canInviteUsers,
  canManageMembers,
  getUserRole,
  isOwner,
} from "@/shared/utils/userRole";

import type { ProjectId } from "../types";
import { PermissionSchema } from "../types";

export const ProjectIdSchema = z
  .union([z.string(), z.number()])
  .transform(String) as z.ZodType<ProjectId>;

// Base Project schema definition
export const ProjectSchema = z.object({
  id: ProjectIdSchema,
  name: z.string(),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v ?? undefined),
  createdAt: z.iso.datetime(),
  tasksCount: z.number().default(0),
});

export type Project = z.infer<typeof ProjectSchema>;

export const createProjectListItem = (raw: unknown): Project => {
  return ProjectSchema.parse(raw);
};

// Full Project schema definition
export const ProjectDetailsSchema = ProjectSchema.extend({
  permissions: z.array(PermissionSchema),
});

export type ProjectDetails = z.infer<typeof ProjectDetailsSchema> & {
  userRole: UserRole;
};

export const createProjectDetails = (raw: unknown): ProjectDetails => {
  const parsed = ProjectDetailsSchema.parse(raw);
  return {
    ...parsed,
    userRole: getUserRole(parsed.permissions),
  };
};

export const canUserEditProject = (project: ProjectDetails): boolean =>
  canEditProject(project.permissions);

export const canUserDeleteProject = (project: ProjectDetails): boolean =>
  canDeleteProject(project.permissions);

export const canUserArchiveProject = (project: ProjectDetails): boolean =>
  canArchiveProject(project.permissions);

export const canUserManageMembers = (project: ProjectDetails): boolean =>
  canManageMembers(project.permissions);

export const canUserInviteMembers = (project: ProjectDetails): boolean =>
  canInviteUsers(project.permissions);

export const isProjectOwner = (project: ProjectDetails): boolean => isOwner(project.permissions);

export const getUserRoleLabelLocalized = (project: ProjectDetails): string => {
  const labels: Record<UserRole, string> = {
    OWNER: "Владелец",
    ADMIN: "Администратор",
    EDITOR: "Редактор",
    VIEWER: "Просмотр",
    NONE: "Нет доступа",
  };
  return labels[project.userRole] || "Неизвестная роль";
};
