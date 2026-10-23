import type { TaskComment } from "@/domain/models/TaskComment";
import type { TaskEvent } from "@/domain/models/TaskEvent";
import type { User } from "@/domain/models/User";

import { buildFeed, describeEvent } from "./feed";

const anna: User = { id: "a", email: "anna@example.com", username: "Анна" };
const petr: User = { id: "p", email: "petr@example.com", username: "Пётр" };

const comment = (id: string, createdAt: string): TaskComment => ({
  id,
  taskId: "t",
  author: anna,
  text: id,
  createdAt,
});

const event = (id: string, createdAt: string, fields: Partial<TaskEvent> = {}): TaskEvent => ({
  id,
  taskId: "t",
  kind: "created",
  actor: anna,
  createdAt,
  ...fields,
});

describe("buildFeed", () => {
  it("merges newest first; with equal time a comment goes above an event", () => {
    const feed = buildFeed(
      [comment("c3", "2026-10-21T12:03:00Z"), comment("c1", "2026-10-21T12:01:00Z")],
      [
        event("e3", "2026-10-21T12:03:00Z"),
        event("e2", "2026-10-21T12:02:00Z"),
        event("e0", "2026-10-21T12:00:00Z"),
      ],
    );

    expect(feed.map((item) => item.id)).toEqual(["c-c3", "e-e3", "e-e2", "c-c1", "e-e0"]);
  });

  it("keeps the server order of rows with the same time", () => {
    const feed = buildFeed(
      [],
      [event("later", "2026-10-21T12:00:00Z"), event("earlier", "2026-10-21T12:00:00Z")],
    );

    expect(feed.map((item) => item.id)).toEqual(["e-later", "e-earlier"]);
    expect(buildFeed([], [])).toEqual([]);
  });
});

describe("describeEvent", () => {
  const names: Record<string, string> = { open: "Открыта", in_progress: "В работе" };
  const line = (fields: Partial<TaskEvent>) =>
    describeEvent(event("e", "2026-10-21T12:00:00Z", fields), (id) => names[id]);

  it("names statuses as the server does", () => {
    expect(line({ kind: "status_changed", fromStatusId: "open", toStatusId: "in_progress" })).toBe(
      "Открыта → В работе",
    );
  });

  it("names priorities", () => {
    expect(line({ kind: "priority_changed", fromPriority: "normal", toPriority: "urgent" })).toBe(
      "Приоритет: Обычный → Срочный",
    );
  });

  it("tells a changed, a set and a removed due date apart", () => {
    expect(line({ kind: "due_date_changed", fromDueDate: "2026-10-30", toDueDate: "2026-11-02" })).toBe(
      "Срок: 30.10.2026 → 02.11.2026",
    );
    expect(line({ kind: "due_date_changed", toDueDate: "2026-10-30" })).toBe("Срок установлен: 30.10.2026");
    expect(line({ kind: "due_date_changed", fromDueDate: "2026-10-30" })).toBe("Срок снят");
  });

  it("tells a changed, a set and a removed assignee apart", () => {
    expect(line({ kind: "assignee_changed", fromUser: anna, toUser: petr })).toBe(
      "Ответственный: Анна → Пётр",
    );
    expect(line({ kind: "assignee_changed", toUser: petr })).toBe("Назначен ответственный: Пётр");
    expect(line({ kind: "assignee_changed", fromUser: anna })).toBe("Ответственный снят");
  });

  it("shows the other kinds", () => {
    expect(line({ kind: "created" })).toBe("Задача создана");
    expect(line({ kind: "moved", fromKey: "DS-5", toKey: "CM-12" })).toBe("Перенесена: DS-5 → CM-12");
    expect(line({ kind: "edited" })).toBe("Изменено название или описание");
    expect(line({ kind: "archived" })).toBe("Задача перемещена в архив");
    expect(line({ kind: "restored" })).toBe("Задача возвращена из архива");
  });
});
