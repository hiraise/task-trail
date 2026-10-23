import { describe, expect, it } from "vitest";

import { dueDateState, formatDueDate, isOverdue, todayLocal } from "./dueDate";

const today = "2026-10-23";

describe("todayLocal", () => {
  it("is the local calendar day", () => {
    expect(todayLocal(new Date(2026, 9, 23, 23, 30))).toBe("2026-10-23");
  });
});

describe("dueDateState", () => {
  it("yesterday — overdue", () => {
    expect(dueDateState("2026-10-22", false, today)).toBe("overdue");
  });

  it("a resolved task is never overdue", () => {
    expect(dueDateState("2026-10-22", true, today)).toBe("later");
  });

  it("today, tomorrow, later", () => {
    expect(dueDateState("2026-10-23", false, today)).toBe("today");
    expect(dueDateState("2026-10-24", false, today)).toBe("tomorrow");
    expect(dueDateState("2026-10-30", false, today)).toBe("later");
  });

  it("tomorrow across a month end", () => {
    expect(dueDateState("2026-11-01", false, "2026-10-31")).toBe("tomorrow");
  });
});

describe("isOverdue", () => {
  it("no due date — not overdue", () => {
    expect(isOverdue(undefined, false, today)).toBe(false);
  });

  it("yesterday and open — overdue, resolved — not", () => {
    expect(isOverdue("2026-10-22", false, today)).toBe(true);
    expect(isOverdue("2026-10-22", true, today)).toBe(false);
  });
});

describe("formatDueDate", () => {
  it("today and tomorrow in words", () => {
    expect(formatDueDate("2026-10-23", today)).toBe("Сегодня");
    expect(formatDueDate("2026-10-24", today)).toBe("Завтра");
  });

  it("this year — day and month without the dot", () => {
    expect(formatDueDate("2026-10-30", today)).toBe("30 окт");
    expect(formatDueDate("2026-10-22", today)).toBe("22 окт");
  });

  it("another year — with the year", () => {
    expect(formatDueDate("2027-10-30", today)).toBe("30 окт 2027");
  });
});
