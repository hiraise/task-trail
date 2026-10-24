import type { Notification } from "@/domain/models/Notification";

import { describeNotification, notificationParts } from "./describe";

const anna = { id: "u1", email: "anna@example.com", username: "Анна Петрова" };
const base: Notification = {
  id: "n1",
  kind: "assigned",
  task: { id: "t1", key: "DS-12", name: "Макет" },
  actor: anna,
  createdAt: "2026-10-28T09:00:00Z",
};
const names = { open: "Открыта", in_progress: "В работе", in_review: "На проверке", done: "Готово" };
const statusName = (id: keyof typeof names) => names[id];

describe("describeNotification", () => {
  it("assigned", () => {
    expect(describeNotification(base, statusName)).toBe(
      "Анна Петрова назначил(а) вас ответственным",
    );
  });

  it("status_changed names both statuses", () => {
    const n: Notification = {
      ...base,
      kind: "status_changed",
      fromStatusId: "open",
      toStatusId: "in_progress",
    };

    expect(describeNotification(n, statusName)).toBe(
      "Анна Петрова изменил(а) статус: Открыта → В работе",
    );
  });

  it("commented", () => {
    const n: Notification = { ...base, kind: "commented", text: "Готово" };

    expect(describeNotification(n, statusName)).toBe("Анна Петрова оставил(а) комментарий");
  });

  it("mentioned", () => {
    expect(describeNotification({ ...base, kind: "mentioned" }, statusName)).toBe(
      "Анна Петрова упомянул(а) вас",
    );
  });

  it("due_soon has no actor and shows the day", () => {
    const n: Notification = { ...base, kind: "due_soon", actor: undefined, dueDate: "2026-10-29" };

    expect(describeNotification(n, statusName)).toBe("Срок завтра, 29.10.2026");
  });

  it("overdue", () => {
    const n: Notification = { ...base, kind: "overdue", actor: undefined, dueDate: "2026-10-27" };

    expect(describeNotification(n, statusName)).toBe("Срок прошёл 27.10.2026");
  });

  it("an actor without a name is shown by the email start", () => {
    const n: Notification = { ...base, actor: { ...anna, username: null } };

    expect(describeNotification(n, statusName)).toBe("anna назначил(а) вас ответственным");
  });
});

describe("notificationParts", () => {
  it("splits the actor from the rest of the sentence", () => {
    expect(notificationParts(base, statusName)).toEqual({
      actor: "Анна Петрова",
      rest: " назначил(а) вас ответственным",
    });
  });

  it("a reminder has only the rest", () => {
    const n: Notification = { ...base, kind: "overdue", actor: undefined, dueDate: "2026-10-27" };

    expect(notificationParts(n, statusName)).toEqual({ rest: "Срок прошёл 27.10.2026" });
  });
});
