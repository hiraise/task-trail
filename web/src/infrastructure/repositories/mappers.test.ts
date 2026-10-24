import {
  toAdminUser,
  toAttachment,
  toBoard,
  toCurrentUser,
  toInvitationResult,
  toNotification,
  toPasswordResetLink,
  toProject,
  toProjectDetails,
  toProjectMember,
  toSearchResult,
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
      emailNotifications: false,
    });

    expect(user.isAdmin).toBe(true);
    expect(user.emailNotifications).toBe(false);
  });
});

describe("toNotification", () => {
  const dto = {
    id,
    kind: "status_changed" as const,
    task: { id, key: "DS-12", name: "Макет" },
    actor: { id, email: "anna@example.com", username: "Анна", avatarId },
    createdAt: "2026-10-22T08:00:00Z",
    readAt: null,
    fromStatusId: "open" as const,
    toStatusId: "done" as const,
    text: null,
    dueDate: null,
  };

  it("maps the actor, the task and the change fields; null becomes undefined", () => {
    const notification = toNotification(dto);

    expect(notification).toMatchObject({
      id,
      kind: "status_changed",
      task: { id, key: "DS-12", name: "Макет" },
      createdAt: dto.createdAt,
      fromStatusId: "open",
      toStatusId: "done",
    });
    expect(notification.actor?.avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
    expect(notification.readAt).toBeUndefined();
    expect(notification.text).toBeUndefined();
    expect(notification.dueDate).toBeUndefined();
  });

  it("a reminder has no actor and keeps the due date", () => {
    const notification = toNotification({
      ...dto,
      kind: "overdue",
      actor: null,
      fromStatusId: null,
      toStatusId: null,
      dueDate: "2026-10-21",
      readAt: "2026-10-22T09:00:00Z",
    });

    expect(notification.actor).toBeUndefined();
    expect(notification.dueDate).toBe("2026-10-21");
    expect(notification.readAt).toBe("2026-10-22T09:00:00Z");
    expect(notification.fromStatusId).toBeUndefined();
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

describe("toBoard", () => {
  it("projects with the archive time or undefined, members with avatar URLs", () => {
    const board = toBoard({
      id,
      name: "Релиз",
      ownerId: avatarId,
      createdAt: "2026-10-23T08:00:00Z",
      updatedAt: "2026-10-23T09:00:00Z",
      projects: [
        { id: avatarId, name: "API", key: "API", archivedAt: "2026-10-23T10:00:00Z" },
        { id, name: "Веб", key: "WEB", archivedAt: null },
      ],
      members: [{ id: avatarId, email: "anna@example.com", username: "Анна", avatarId }],
      tasksCount: 3,
    });

    expect(board.projects).toEqual([
      { id: avatarId, name: "API", key: "API", archivedAt: "2026-10-23T10:00:00Z" },
      { id, name: "Веб", key: "WEB", archivedAt: undefined },
    ]);
    expect(board.members[0].avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
    expect(board).toMatchObject({ id, name: "Релиз", ownerId: avatarId, tasksCount: 3 });
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
    priority: "normal" as const,
    dueDate: null,
    authorId: avatarId,
    assigneeId: null,
    archivedAt: null,
    projectArchived: false,
    labels: [],
    parentId: null,
    subtasksTotal: 0,
    subtasksDone: 0,
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
      priority: "normal",
      dueDate: undefined,
      authorId: avatarId,
      assigneeId: undefined,
      archivedAt: undefined,
      projectArchived: false,
      labels: [],
      parentId: undefined,
      subtasksTotal: 0,
      subtasksDone: 0,
      createdAt: "2026-10-22T08:00:00Z",
      updatedAt: "2026-10-22T09:30:00Z",
    });
  });

  it("a subtask: the parent and the counters as in the response", () => {
    expect(toTask({ ...dto, parentId: avatarId, subtasksTotal: 5, subtasksDone: 2 })).toMatchObject({
      parentId: avatarId,
      subtasksTotal: 5,
      subtasksDone: 2,
    });
  });

  it("labels as in the response, in its order", () => {
    const label = { id, projectId: dto.projectId, name: "Фронтенд", color: "blue" as const };

    expect(toTask({ ...dto, labels: [label, { ...label, id: avatarId, name: "Баг", color: "red" }] }).labels).toEqual([
      label,
      { ...label, id: avatarId, name: "Баг", color: "red" },
    ]);
  });

  it("description and assignee as in the response", () => {
    expect(toTask({ ...dto, description: "К пятнице", assigneeId: id })).toMatchObject({
      description: "К пятнице",
      assigneeId: id,
    });
  });

  it("due date as in the response", () => {
    expect(toTask({ ...dto, dueDate: "2026-10-30" })).toMatchObject({ dueDate: "2026-10-30" });
  });

  it("archive of the task and of its project as in the response", () => {
    expect(
      toTask({ ...dto, archivedAt: "2026-10-23T10:00:00Z", projectArchived: true }),
    ).toMatchObject({ archivedAt: "2026-10-23T10:00:00Z", projectArchived: true });
  });
});

describe("toSearchResult", () => {
  it("maps each group with the list mappers, keeping the order", () => {
    const result = toSearchResult({
      projects: [
        {
          id,
          name: "Дизайн",
          description: null,
          key: "DS",
          archivedAt: "2026-10-23T10:00:00Z",
          createdAt: "2026-10-22T08:00:00Z",
          updatedAt: "2026-10-22T09:00:00Z",
          tasksCount: 2,
        },
      ],
      boards: [],
      tasks: [
        {
          id: avatarId,
          projectId: id,
          number: 1,
          key: "DS-1",
          name: "Первая",
          description: null,
          statusId: "open",
          priority: "normal",
          dueDate: null,
          authorId: id,
          assigneeId: null,
          archivedAt: null,
          projectArchived: true,
          labels: [],
          parentId: null,
          subtasksTotal: 0,
          subtasksDone: 0,
          createdAt: "2026-10-22T08:00:00Z",
          updatedAt: "2026-10-22T09:00:00Z",
        },
      ],
    });

    expect(result.projects).toEqual([expect.objectContaining({ key: "DS", description: undefined })]);
    expect(result.projects[0].archivedAt).toBe("2026-10-23T10:00:00Z");
    expect(result.boards).toEqual([]);
    expect(result.tasks).toEqual([
      expect.objectContaining({ key: "DS-1", assigneeId: undefined, projectArchived: true }),
    ]);
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

describe("toAttachment", () => {
  it("keeps the file fields; the author is a user with an avatar URL", () => {
    const dto = {
      id,
      taskId: id,
      name: "макет.png",
      mimeType: "image/png",
      size: 2_516_582,
      author: { id, email: "anna@example.com", username: "Анна", avatarId },
      createdAt: "2026-10-22T08:00:00Z",
    };

    const attachment = toAttachment(dto);

    expect(attachment).toMatchObject({
      id,
      taskId: id,
      name: "макет.png",
      mimeType: "image/png",
      size: 2_516_582,
      createdAt: dto.createdAt,
    });
    expect(attachment.author.avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
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
    fromPriority: null,
    toPriority: null,
    fromDueDate: null,
    toDueDate: null,
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
      fromPriority: undefined,
      toPriority: undefined,
      fromDueDate: undefined,
      toDueDate: undefined,
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
    expect(
      toTaskEvent({ ...dto, kind: "priority_changed", fromPriority: "normal", toPriority: "urgent" }),
    ).toMatchObject({ fromPriority: "normal", toPriority: "urgent" });
    expect(
      toTaskEvent({ ...dto, kind: "due_date_changed", fromDueDate: null, toDueDate: "2026-10-30" }),
    ).toMatchObject({ fromDueDate: undefined, toDueDate: "2026-10-30" });
    expect(toTaskEvent({ ...dto, kind: "moved", fromKey: "DS-1", toKey: "BE-4" })).toMatchObject({
      fromKey: "DS-1",
      toKey: "BE-4",
    });
  });
});
