import {
  toCurrentUser,
  toInvitationResult,
  toProject,
  toProjectDetails,
  toProjectMember,
  toUser,
} from "./mappers";

const id = "0b8c2f4e-3d5a-4a51-9a8e-1c2b3d4e5f60";
const avatarId = "7d1e9a52-6f0b-4c1f-8f43-2a9e5b7c1d08";

describe("toUser", () => {
  it("собирает адрес аватарки из ID файла", () => {
    const user = toUser({ id, email: "user@example.com", username: "Аня", avatarId });

    expect(user.avatarUrl).toMatch(new RegExp(`/v1/files/${avatarId}$`));
    expect(user).toMatchObject({ id, email: "user@example.com", username: "Аня" });
  });

  it("без аватарки адреса нет", () => {
    const user = toUser({ id, email: "user@example.com", username: null, avatarId: null });

    expect(user.avatarUrl).toBeUndefined();
    expect(user.username).toBeNull();
  });
});

describe("toCurrentUser", () => {
  it("сохраняет признак администратора сервиса", () => {
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
    createdAt: "2026-10-22T08:00:00Z",
    tasksCount: 3,
  };

  it("описания нет — undefined, остальное как в ответе", () => {
    expect(toProject(dto)).toEqual({
      id,
      name: "Сайт",
      description: undefined,
      createdAt: "2026-10-22T08:00:00Z",
      tasksCount: 3,
    });
  });

  it("проект с ролью текущего пользователя", () => {
    expect(toProjectDetails({ ...dto, description: "О сайте", role: "admin" })).toMatchObject({
      description: "О сайте",
      role: "admin",
    });
  });
});

describe("toProjectMember", () => {
  it("пользователь с ролью и адресом аватарки", () => {
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
  it("ссылка приглашения — только когда она есть", () => {
    const url = "http://localhost:3000/auth/invite?token=abc";

    expect(
      toInvitationResult({ email: "new@example.com", result: "invited", inviteUrl: url }),
    ).toEqual({ email: "new@example.com", outcome: "invited", inviteUrl: url });
    expect(
      toInvitationResult({ email: "new@example.com", result: "mail_failed", inviteUrl: null }),
    ).toEqual({ email: "new@example.com", outcome: "mail_failed", inviteUrl: undefined });
  });
});
