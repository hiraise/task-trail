import { describe, expect, it } from "vitest";

import { sortItems } from "./sortItems";

const items = [
  { name: "бюджет", createdAt: "2026-10-20T08:00:00Z", updatedAt: "2026-10-23T08:00:00Z" },
  { name: "Ёлка", createdAt: "2026-10-22T08:00:00Z", updatedAt: "2026-10-21T08:00:00Z" },
  { name: "Альфа", createdAt: "2026-10-21T08:00:00Z", updatedAt: "2026-10-22T08:00:00Z" },
  { name: "Яблоко", createdAt: "2026-10-19T08:00:00Z", updatedAt: "2026-10-19T08:00:00Z" },
];
const names = (option: Parameters<typeof sortItems>[1]) =>
  sortItems(items, option).map((item) => item.name);

describe("sortItems", () => {
  it("dates — newest first", () => {
    expect(names("updatedAt")).toEqual(["бюджет", "Альфа", "Ёлка", "Яблоко"]);
    expect(names("createdAt")).toEqual(["Ёлка", "Альфа", "бюджет", "Яблоко"]);
  });

  it("names — Russian alphabet, case-insensitive, Ё after Е", () => {
    expect(names("nameAsc")).toEqual(["Альфа", "бюджет", "Ёлка", "Яблоко"]);
    expect(names("nameDesc")).toEqual(["Яблоко", "Ёлка", "бюджет", "Альфа"]);
  });

  it("does not change the list it got", () => {
    sortItems(items, "nameAsc");
    expect(items[0].name).toBe("бюджет");
  });
});
