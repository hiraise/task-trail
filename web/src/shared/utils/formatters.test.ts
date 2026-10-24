import { describe, expect, it } from "vitest";

import { formatFileSize } from "./formatters";

const KB = 1024;
const MB = 1024 * KB;

describe("formatFileSize", () => {
  it.each([
    [0, "0 Б"],
    [512, "512 Б"],
    [1023, "1023 Б"],
    [1024, "1,0 КБ"],
    [2.4 * KB, "2,4 КБ"],
    [312 * KB, "312 КБ"],
    [1023.97 * KB, "1,0 МБ"],
    [2.4 * MB, "2,4 МБ"],
    [25 * MB, "25,0 МБ"],
    [860 * MB, "860 МБ"],
  ])("%d bytes — %s", (bytes, text) => {
    expect(formatFileSize(bytes)).toBe(text.replace(" ", "\u00a0"));
  });
});
