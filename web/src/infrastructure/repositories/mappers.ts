import type { AdminUser } from "@/domain/models/AdminUser";
import type { Board } from "@/domain/models/Board";
import type { InvitationResult } from "@/domain/models/Invitation";
import type { Label } from "@/domain/models/Label";
import type { PasswordResetLink } from "@/domain/models/PasswordResetLink";
import type { Project, ProjectDetails } from "@/domain/models/Project";
import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { SearchResult } from "@/domain/models/SearchResult";
import type { MailSettings, ServiceSettings } from "@/domain/models/ServiceSettings";
import type { Task } from "@/domain/models/Task";
import type { TaskComment } from "@/domain/models/TaskComment";
import type { TaskEvent } from "@/domain/models/TaskEvent";
import type { TaskStatus } from "@/domain/models/TaskStatus";
import type { CurrentUser, User } from "@/domain/models/User";

import type {
  AdminUser as AdminUserDto,
  Board as BoardDto,
  CurrentUser as CurrentUserDto,
  InvitationResult as InvitationResultDto,
  Label as LabelDto,
  MailSettings as MailSettingsDto,
  Member as MemberDto,
  PasswordResetLink as PasswordResetLinkDto,
  ProjectDetails as ProjectDetailsDto,
  Project as ProjectDto,
  SearchResult as SearchResultDto,
  ServiceSettings as ServiceSettingsDto,
  TaskComment as TaskCommentDto,
  TaskEvent as TaskEventDto,
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
  key: dto.key,
  archivedAt: dto.archivedAt ?? undefined,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
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

export const toLabel = (dto: LabelDto): Label => ({
  id: dto.id,
  projectId: dto.projectId,
  name: dto.name,
  color: dto.color,
});

export const toTask = (dto: TaskDto): Task => ({
  id: dto.id,
  projectId: dto.projectId,
  number: dto.number,
  key: dto.key,
  name: dto.name,
  description: dto.description ?? undefined,
  statusId: dto.statusId,
  priority: dto.priority,
  dueDate: dto.dueDate ?? undefined,
  authorId: dto.authorId,
  assigneeId: dto.assigneeId ?? undefined,
  archivedAt: dto.archivedAt ?? undefined,
  projectArchived: dto.projectArchived,
  labels: dto.labels.map(toLabel),
  parentId: dto.parentId ?? undefined,
  subtasksTotal: dto.subtasksTotal,
  subtasksDone: dto.subtasksDone,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

export const toBoard = (dto: BoardDto): Board => ({
  id: dto.id,
  name: dto.name,
  ownerId: dto.ownerId,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
  projects: dto.projects.map((project) => ({
    id: project.id,
    name: project.name,
    key: project.key,
    archivedAt: project.archivedAt ?? undefined,
  })),
  members: dto.members.map(toUser),
  tasksCount: dto.tasksCount,
});

export const toSearchResult = (dto: SearchResultDto): SearchResult => ({
  projects: dto.projects.map(toProject),
  boards: dto.boards.map(toBoard),
  tasks: dto.tasks.map(toTask),
});

export const toTaskComment = (dto: TaskCommentDto): TaskComment => ({
  id: dto.id,
  taskId: dto.taskId,
  author: toUser(dto.author),
  text: dto.text,
  createdAt: dto.createdAt,
  editedAt: dto.editedAt ?? undefined,
});

export const toTaskEvent = (dto: TaskEventDto): TaskEvent => ({
  id: dto.id,
  taskId: dto.taskId,
  kind: dto.kind,
  actor: toUser(dto.actor),
  createdAt: dto.createdAt,
  fromStatusId: dto.fromStatusId ?? undefined,
  toStatusId: dto.toStatusId ?? undefined,
  fromPriority: dto.fromPriority ?? undefined,
  toPriority: dto.toPriority ?? undefined,
  fromDueDate: dto.fromDueDate ?? undefined,
  toDueDate: dto.toDueDate ?? undefined,
  fromUser: dto.fromUser ? toUser(dto.fromUser) : undefined,
  toUser: dto.toUser ? toUser(dto.toUser) : undefined,
  fromKey: dto.fromKey ?? undefined,
  toKey: dto.toKey ?? undefined,
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
