import { createUser } from "./User";

describe("createUser", () => {
  it("принимает пользователя без аватарки, когда сервер отдаёт avatarUrl: null", () => {
    const user = createUser({ id: 1, email: "user@example.com", username: null, avatarUrl: null });

    expect(user.id).toBe("1");
    expect(user.avatarUrl).toBeUndefined();
  });

  it("сохраняет адрес аватарки", () => {
    const user = createUser({ id: "u1", email: "user@example.com", avatarUrl: "https://example.com/a.png" });

    expect(user.avatarUrl).toBe("https://example.com/a.png");
  });

  it("отклоняет некорректный адрес аватарки", () => {
    expect(() => createUser({ id: "u1", email: "user@example.com", avatarUrl: "не адрес" })).toThrow();
  });
});
