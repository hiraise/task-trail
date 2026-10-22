import type { AdminUser } from "@/domain/models/AdminUser";
import type { InvitationResult } from "@/domain/models/Invitation";
import type { PasswordResetLink } from "@/domain/models/PasswordResetLink";
import type { Project, ProjectDetails } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { MailSettings, ServiceSettings } from "@/domain/models/ServiceSettings";
import type { Task } from "@/domain/models/Task";
import type { TaskStatus } from "@/domain/models/TaskStatus";
import type { CurrentUser, User } from "@/domain/models/User";

import type {
  AdminUser as AdminUserDto,
  CurrentUser as CurrentUserDto,
  InvitationResult as InvitationResultDto,
  MailSettings as MailSettingsDto,
  Member as MemberDto,
  PasswordResetLink as PasswordResetLinkDto,
  ProjectDetails as ProjectDetailsDto,
  Project as ProjectDto,
  ServiceSettings as ServiceSettingsDto,
  TaskStatus as TaskStatusDto,
  Task as TaskDto,
  User as UserDto,
} from "../api/generated";
import { fileUrl } from "../config/apiRoutes";

// API responses arrive in contract types (ADR-0020) and are mapped to domain models here,
// without schema validation: the server's contract tests check the response shape (ADR-0019).

export const toUser = (dto: UserDto): User => ({
  id: dto.id,
  email: dto.email,
  username: dto.username,
  avatarUrl: dto.avatarId ? fileUrl(dto.avatarId) : undefined,
});

export const toCurrentUser = (dto: CurrentUserDto): CurrentUser => ({
  ...toUser(dto),
  isAdmin: dto.isAdmin,
});

export const toProject = (dto: ProjectDto): Project => ({
  id: dto.id,
  name: dto.name,
  description: dto.description ?? undefined,
  createdAt: dto.createdAt,
  tasksCount: dto.tasksCount,
});

export const toProjectDetails = (dto: ProjectDetailsDto): ProjectDetails => ({
  ...toProject(dto),
  role: dto.role,
});

export const toProjectMember = (dto: MemberDto): ProjectMember => ({
  ...toUser(dto),
  role: dto.role,
});

export const toInvitationResult = (dto: InvitationResultDto): InvitationResult => ({
  email: dto.email,
  outcome: dto.result,
  inviteUrl: dto.inviteUrl ?? undefined,
});

export const toTask = (dto: TaskDto): Task => ({
  id: dto.id,
  projectId: dto.projectId,
  name: dto.name,
  description: dto.description ?? undefined,
  statusId: dto.statusId,
  authorId: dto.authorId,
  assigneeId: dto.assigneeId ?? undefined,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

export const toTaskStatus = (dto: TaskStatusDto): TaskStatus => ({
  id: dto.id,
  name: dto.name,
  isDefault: dto.isDefault,
  isResolved: dto.isResolved,
});

const toMailSettings = (dto: MailSettingsDto): MailSettings => ({
  host: dto.host,
  port: dto.port,
  encryption: dto.encryption,
  sender: dto.sender,
  username: dto.username ?? undefined,
  passwordSet: dto.passwordSet,
});

export const toServiceSettings = (dto: ServiceSettingsDto): ServiceSettings => ({
  serviceUrl: dto.serviceUrl,
  mail: dto.mail ? toMailSettings(dto.mail) : undefined,
});

export const toAdminUser = (dto: AdminUserDto): AdminUser => ({
  ...toUser(dto),
  isAdmin: dto.isAdmin,
  createdAt: dto.createdAt,
});

export const toPasswordResetLink = (dto: PasswordResetLinkDto): PasswordResetLink => ({
  url: dto.url,
  expiresAt: dto.expiresAt,
});
