import {
  toAdminUser,
  toCurrentUser,
  toInvitationResult,
  toPasswordResetLink,
  toProject,
  toProjectDetails,
  toProjectMember,
  toServiceSettings,
  toTask,
  toTaskComment,
  toTaskEvent,
  toTaskStatus,
  toUser,
} from "./mappers";

const id = "0b8c2f4e-3d5a-4a51-9a8e-1c2b3d4e5f60";
const avatarId = "7d1e9a52-6f0b-4c1f-8f43-2a9e5b7c1d08";

describe("toUser", () => {
  it("builds the avatar URL from the file ID", () => {
    const user = toUser({ id, email: "user@example.com", username: "Аня", avatarId });

    expect(user.avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
    expect(user).toMatchObject({ id, email: "user@example.com", username: "Аня" });
  });

  it("no avatar — no URL", () => {
    const user = toUser({ id, email: "user@example.com", username: null, avatarId: null });

    expect(user.avatarUrl).toBeUndefined();
    expect(user.username).toBeNull();
  });
});

describe("toCurrentUser", () => {
  it("keeps the service administrator flag", () => {
    const user = toCurrentUser({
      id,
      email: "admin@example.com",
      username: null,
      avatarId: null,
      isAdmin: true,
    });

    expect(user.isAdmin).toBe(true);
  });
});

describe("toProject", () => {
  const dto = {
    id,
    name: "Сайт",
    description: null,
    key: "РМП",
    archivedAt: null,
    createdAt: "2026-10-22T08:00:00Z",
    updatedAt: "2026-10-22T09:00:00Z",
    tasksCount: 3,
  };

  it("no description or archive — undefined, the rest as in the response", () => {
    expect(toProject(dto)).toEqual({
      id,
      name: "Сайт",
      description: undefined,
      key: "РМП",
      archivedAt: undefined,
      createdAt: "2026-10-22T08:00:00Z",
      updatedAt: "2026-10-22T09:00:00Z",
      tasksCount: 3,
    });
  });

  it("archived project keeps the archive time", () => {
    expect(toProject({ ...dto, archivedAt: "2026-10-23T10:00:00Z" }).archivedAt).toBe(
      "2026-10-23T10:00:00Z",
    );
  });

  it("project with the current user's role", () => {
    expect(toProjectDetails({ ...dto, description: "О сайте", role: "admin" })).toMatchObject({
      description: "О сайте",
      role: "admin",
    });
  });
});

describe("toProjectMember", () => {
  it("user with a role and avatar URL", () => {
    const member = toProjectMember({
      id,
      email: "owner@example.com",
      username: null,
      avatarId,
      role: "owner",
    });

    expect(member).toMatchObject({ id, email: "owner@example.com", role: "owner" });
    expect(member.avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
  });
});

describe("toInvitationResult", () => {
  it("invitation link only when present", () => {
    const url = "http://localhost:3000/auth/invite?token=abc";

    expect(
      toInvitationResult({ email: "new@example.com", result: "invited", inviteUrl: url }),
    ).toEqual({ email: "new@example.com", outcome: "invited", inviteUrl: url });
    expect(
      toInvitationResult({ email: "new@example.com", result: "mail_failed", inviteUrl: null }),
    ).toEqual({ email: "new@example.com", outcome: "mail_failed", inviteUrl: undefined });
  });
});

describe("toTask", () => {
  const dto = {
    id,
    projectId: "5c3f8e21-9b4d-4e6a-8f12-3a4b5c6d7e80",
    number: 12,
    key: "DS-12",
    name: "Собрать отчёт",
    description: null,
    statusId: "in_review" as const,
    authorId: avatarId,
    assigneeId: null,
    archivedAt: null,
    projectArchived: false,
    createdAt: "2026-10-22T08:00:00Z",
    updatedAt: "2026-10-22T09:30:00Z",
  };

  it("no description or assignee — undefined, status is the contract ID", () => {
    expect(toTask(dto)).toEqual({
      id,
      projectId: dto.projectId,
      number: 12,
      key: "DS-12",
      name: "Собрать отчёт",
      description: undefined,
      statusId: "in_review",
      authorId: avatarId,
      assigneeId: undefined,
      archivedAt: undefined,
      projectArchived: false,
      createdAt: "2026-10-22T08:00:00Z",
      updatedAt: "2026-10-22T09:30:00Z",
    });
  });

  it("description and assignee as in the response", () => {
    expect(toTask({ ...dto, description: "К пятнице", assigneeId: id })).toMatchObject({
      description: "К пятнице",
      assigneeId: id,
    });
  });

  it("archive of the task and of its project as in the response", () => {
    expect(
      toTask({ ...dto, archivedAt: "2026-10-23T10:00:00Z", projectArchived: true }),
    ).toMatchObject({ archivedAt: "2026-10-23T10:00:00Z", projectArchived: true });
  });
});

describe("toTaskStatus", () => {
  it("name from the server, status flags as in the response", () => {
    expect(
      toTaskStatus({ id: "done", name: "Готово", isDefault: false, isResolved: true }),
    ).toEqual({ id: "done", name: "Готово", isDefault: false, isResolved: true });
  });
});

describe("toServiceSettings", () => {
  const mail = {
    host: "smtp.example.com",
    port: 587,
    encryption: "starttls" as const,
    sender: "TaskTrail <noreply@example.com>",
    username: "noreply@example.com",
    passwordSet: true,
  };

  it("mail not configured — undefined", () => {
    expect(toServiceSettings({ serviceUrl: "https://example.com/tasktrail", mail: null })).toEqual({
      serviceUrl: "https://example.com/tasktrail",
      mail: undefined,
    });
  });

  it("SMTP settings as in the response, no password — only a flag", () => {
    const settings = toServiceSettings({ serviceUrl: "http://localhost:3000", mail });

    expect(settings.mail).toEqual(mail);
    expect(settings.mail).not.toHaveProperty("password");
  });

  it("no SMTP login — undefined", () => {
    const settings = toServiceSettings({
      serviceUrl: "http://localhost:3000",
      mail: { ...mail, encryption: "none", username: null, passwordSet: false },
    });

    expect(settings.mail).toMatchObject({ encryption: "none", username: undefined, passwordSet: false });
  });
});

describe("toAdminUser", () => {
  it("user with the administrator flag, registration date and avatar URL", () => {
    const user = toAdminUser({
      id,
      email: "admin@example.com",
      username: "Аня",
      avatarId,
      isAdmin: true,
      createdAt: "2026-10-21T08:00:00Z",
    });

    expect(user).toMatchObject({
      id,
      email: "admin@example.com",
      username: "Аня",
      isAdmin: true,
      createdAt: "2026-10-21T08:00:00Z",
    });
    expect(user.avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
  });
});

describe("toPasswordResetLink", () => {
  it("link and expiry as in the response", () => {
    const link = { url: "http://localhost:3000/auth/reset?token=abc", expiresAt: "2026-10-23T08:00:00Z" };

    expect(toPasswordResetLink(link)).toEqual(link);
  });
});

describe("toTaskComment", () => {
  const author = { id, email: "anna@example.com", username: "Анна", avatarId };
  const dto = {
    id,
    taskId: id,
    author,
    text: "Привет",
    createdAt: "2026-10-22T08:00:00Z",
    editedAt: null,
  };

  it("never edited — no editedAt; the author is a user with an avatar URL", () => {
    const comment = toTaskComment(dto);

    expect(comment.editedAt).toBeUndefined();
    expect(comment.author.avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
    expect(comment).toMatchObject({ id, taskId: id, text: "Привет", createdAt: dto.createdAt });
  });

  it("edited — keeps the edit time", () => {
    expect(toTaskComment({ ...dto, editedAt: "2026-10-22T09:00:00Z" }).editedAt).toBe(
      "2026-10-22T09:00:00Z",
    );
  });
});

describe("toTaskEvent", () => {
  const actor = { id, email: "anna@example.com", username: "Анна", avatarId: null };
  const dto = {
    id,
    taskId: id,
    kind: "created" as const,
    actor,
    createdAt: "2026-10-22T08:00:00Z",
    fromStatusId: null,
    toStatusId: null,
    fromUser: null,
    toUser: null,
    fromKey: null,
    toKey: null,
  };

  it("fields the kind does not use are undefined", () => {
    const event = toTaskEvent(dto);

    expect(event).toEqual({
      id,
      taskId: id,
      kind: "created",
      actor: { id, email: "anna@example.com", username: "Анна", avatarUrl: undefined },
      createdAt: dto.createdAt,
      fromStatusId: undefined,
      toStatusId: undefined,
      fromUser: undefined,
      toUser: undefined,
      fromKey: undefined,
      toKey: undefined,
    });
  });

  it("keeps the change: statuses, keys and users", () => {
    const event = toTaskEvent({
      ...dto,
      kind: "assignee_changed",
      fromUser: actor,
      toUser: null,
    });

    expect(event.fromUser?.email).toBe("anna@example.com");
    expect(event.toUser).toBeUndefined();
    expect(
      toTaskEvent({ ...dto, kind: "status_changed", fromStatusId: "open", toStatusId: "done" }),
    ).toMatchObject({ fromStatusId: "open", toStatusId: "done" });
    expect(toTaskEvent({ ...dto, kind: "moved", fromKey: "DS-1", toKey: "BE-4" })).toMatchObject({
      fromKey: "DS-1",
      toKey: "BE-4",
    });
  });
});
