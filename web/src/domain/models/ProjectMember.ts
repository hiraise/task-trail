import z from "zod";

import type { UserRole } from "@/shared/utils/userRole";
import { getUserRole, isAdmin, isOwner } from "@/shared/utils/userRole";

import type { UserId } from "../types";
import { PermissionSchema } from "../types";

export const ProjectMemberSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String).pipe(z.string()) as z.ZodType<UserId>,
  email: z.email(),
  username: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? ""),
  permissions: z.array(PermissionSchema),
});

export type ProjectMember = z.infer<typeof ProjectMemberSchema> & {
  userRole: UserRole;
};

export const createProjectMember = (raw: unknown): ProjectMember => {
  const parsed = ProjectMemberSchema.parse(raw);

  return {
    ...parsed,
    userRole: getUserRole(parsed.permissions),
  };
};

export const getProjectMemberDisplayName = (member: ProjectMember): string => {
  return member.username?.trim() || member.email;
};

export const isProjectMemberOwner = (member: ProjectMember): boolean => isOwner(member.permissions);

export const isProjectMemberAdmin = (member: ProjectMember): boolean => isAdmin(member.permissions);

export const getProjectMemberRoleLabelLocalized = (member: ProjectMember): string => {
  const labels: Record<UserRole, string> = {
    OWNER: "Владелец",
    ADMIN: "Администратор",
    EDITOR: "Редактор",
    VIEWER: "Просмотр",
    NONE: "Нет доступа",
  };

  return labels[member.userRole] || "Неизвестная роль";
};
