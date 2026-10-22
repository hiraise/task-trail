import { suggestProjectKey } from "./projectKey";

describe("suggestProjectKey", () => {
  it.each([
    ["Разработка мобильного приложения", "РМП"],
    ["Design System", "DS"],
    ["Бюджет", "БЮД"],
    ["Дизайн-система", "ДС"],
    ["  web   app 2 ", "WA2"],
    ["Один два три четыре пять шесть семь восемь девять десять одиннадцать", "ОДТЧПШСВДД"],
  ])("%s → %s", (name, key) => {
    expect(suggestProjectKey(name)).toBe(key);
  });

  it.each(["Я", "2024 План", "", "  ", "2024"])("%j — only one letter or none, the user types the key", (name) => {
    expect(suggestProjectKey(name)).toBe("");
  });
});
