import { describe, expect, it } from "vitest";

import { decodeMentions, encodeMentions, mentionToken, splitMentions } from "./mentions";

const ANNA = "11111111-1111-1111-1111-111111111111";
const ANNA_P = "22222222-2222-2222-2222-222222222222";

describe("mentionToken", () => {
  it("drops brackets and line breaks from the name and cuts it to 100 characters", () => {
    expect(mentionToken({ id: ANNA, name: "А]нна\nП" })).toBe(`@[А нна П](${ANNA})`);
    expect(mentionToken({ id: ANNA, name: "x".repeat(150) })).toBe(`@[${"x".repeat(100)}](${ANNA})`);
  });
});

describe("encodeMentions and decodeMentions", () => {
  it("round-trips a comment with a mention", () => {
    const mentions = [{ id: ANNA_P, name: "Анна Петрова" }];
    const encoded = encodeMentions("@Анна Петрова, посмотри", mentions);

    expect(encoded).toBe(`@[Анна Петрова](${ANNA_P}), посмотри`);
    expect(decodeMentions(encoded)).toEqual({ text: "@Анна Петрова, посмотри", mentions });
  });

  it("replaces the longer of two names with a shared prefix first", () => {
    const mentions = [
      { id: ANNA, name: "Анна" },
      { id: ANNA_P, name: "Анна Петрова" },
    ];

    expect(encodeMentions("@Анна Петрова и @Анна", mentions)).toBe(
      `@[Анна Петрова](${ANNA_P}) и @[Анна](${ANNA})`,
    );
  });

  it("drops a mention whose name was erased and keeps a longer word as text", () => {
    expect(encodeMentions("@Анн и @Аннушка", [{ id: ANNA, name: "Анна" }])).toBe("@Анн и @Аннушка");
  });

  it("leaves brackets that are not a token alone", () => {
    const text = "массив [1] и @[не токен](abc)";

    expect(encodeMentions(text, [])).toBe(text);
    expect(decodeMentions(text)).toEqual({ text, mentions: [] });
    expect(splitMentions(text)).toEqual([{ type: "text", text }]);
  });
});

describe("splitMentions", () => {
  it("splits a comment with a link and a mention", () => {
    expect(splitMentions(`см. https://example.com @[Анна](${ANNA})!`)).toEqual([
      { type: "text", text: "см. https://example.com " },
      { type: "mention", name: "Анна", id: ANNA },
      { type: "text", text: "!" },
    ]);
  });
});
