import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProjectMember } from "@/domain/models/ProjectMember";

import {
  filterMembers,
  findMentionTrigger,
  insertMention,
  useMentionSuggestions,
} from "./useMentionSuggestions";

const member = (id: string, username: string | null, email: string): ProjectMember => ({
  id,
  username,
  email,
  role: "member",
});

const anna = member("anna", "Анна Петрова", "anna@example.com");
const nastya = member("nastya", "Анастасия Кравец", "kravets@example.com");
const ivan = member("ivan", null, "ivan@example.com");
const members = [anna, nastya, ivan];

describe("findMentionTrigger", () => {
  it("finds @ at the start and after a space", () => {
    expect(findMentionTrigger("@Ан", 3)).toEqual({ start: 0, end: 3, query: "Ан" });
    expect(findMentionTrigger("Привет @", 8)).toEqual({ start: 7, end: 8, query: "" });
    expect(findMentionTrigger("Привет\n@Анна П", 14)).toEqual({ start: 7, end: 14, query: "Анна П" });
  });

  it("ignores @ inside a word, after a line break in the query or longer than 30 characters", () => {
    expect(findMentionTrigger("mail@example", 12)).toBeNull();
    expect(findMentionTrigger("@Анна\nП", 7)).toBeNull();
    expect(findMentionTrigger(`@${"a".repeat(31)}`, 32)).toBeNull();
  });

  it("looks only before the caret", () => {
    expect(findMentionTrigger("@Ан и дальше", 3)).toEqual({ start: 0, end: 3, query: "Ан" });
    expect(findMentionTrigger("@Ан", 0)).toBeNull();
  });
});

describe("filterMembers", () => {
  it("matches the display name or email case-insensitively, at most 6", () => {
    expect(filterMembers(members, "ан")).toEqual([anna, nastya]);
    expect(filterMembers(members, "KRAVETS")).toEqual([nastya]);
    expect(filterMembers(members, "ivan")).toEqual([ivan]);
    expect(filterMembers(members, "")).toEqual(members);

    const many = Array.from({ length: 8 }, (_, i) => member(`m${i}`, `Член ${i}`, `m${i}@x.ru`));

    expect(filterMembers(many, "член")).toHaveLength(6);
  });
});

describe("insertMention", () => {
  it("replaces the typed part with the display name and a space", () => {
    const text = "Посмотри, @Ан, пожалуйста";

    expect(insertMention(text, { start: 10, end: 13, query: "Ан" }, anna)).toEqual({
      text: "Посмотри, @Анна Петрова , пожалуйста",
      caret: 24,
      mention: { id: "anna", name: "Анна Петрова" },
    });
    expect(insertMention("@iv", { start: 0, end: 3, query: "iv" }, ivan).text).toBe("@ivan ");
  });
});

describe("useMentionSuggestions", () => {
  it("opens on a match, moves the highlight with wrapping and closes on dismiss", () => {
    const { result, rerender } = renderHook(
      ({ text }) => useMentionSuggestions(text, text.length, members),
      { initialProps: { text: "@Ан" } },
    );

    expect(result.current.open).toBe(true);
    expect(result.current.items).toEqual([anna, nastya]);
    expect(result.current.active).toBe(0);

    act(() => result.current.move(-1));
    expect(result.current.active).toBe(1);
    act(() => result.current.move(1));
    expect(result.current.active).toBe(0);

    act(() => result.current.dismiss());
    expect(result.current.open).toBe(false);

    // Typing on after the same @ keeps it closed; a new @ opens it again
    rerender({ text: "@Анн" });
    expect(result.current.open).toBe(false);
    rerender({ text: "@Анн " });
    rerender({ text: "@Анн, " });
    rerender({ text: "@Анн, @" });
    expect(result.current.open).toBe(true);
  });

  it("stays closed when nobody matches", () => {
    const { result } = renderHook(() => useMentionSuggestions("@zzz", 4, members));

    expect(result.current.open).toBe(false);
  });
});
