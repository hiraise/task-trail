import { toCurrentUser, toUser } from "./mappers";

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
