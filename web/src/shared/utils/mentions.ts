import type { UserId } from "@/domain/types";

/** A member mentioned in a comment: the name shown after `@` and the user ID (ADR-0039). */
export interface Mention {
  id: UserId;
  name: string;
}

/** Parts of a comment to render: plain text and mentions. */
export type CommentPart = { type: "text"; text: string } | { type: "mention"; name: string; id: UserId };

// The same expression as entity.ParseMentions on the server (ADR-0039); a new RegExp per call,
// because a global one keeps lastIndex between calls.
const TOKEN_SOURCE =
  "@\\[([^\\]\\n]{1,100})\\]\\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\\)";
const tokenRegExp = () => new RegExp(TOKEN_SOURCE, "g");

const NAME_LIMIT = 100;

/** A name that fits a token: without `]` and line breaks, at most 100 characters, never empty. */
const cleanName = (name: string) =>
  name.replace(/[\]\r\n]/g, " ").trim().slice(0, NAME_LIMIT).trim() || "?";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The token for the API: names lose `]` and line breaks, at most 100 characters. */
export const mentionToken = (m: Mention) => `@[${cleanName(m.name)}](${m.id})`;

/**
 * Field text → API text: each `@Name` of a picked mention becomes its token. Longer names are replaced
 * first, so "@Anna Petrova" wins over "@Anna". A mention whose `@Name` was erased is dropped. `@Name`
 * followed by a letter or digit is another word ("@Ann" in "@Anna") and stays text.
 */
export function encodeMentions(text: string, mentions: Mention[]): string {
  const byName = new Map<string, Mention>();

  for (const m of mentions) if (m.name) byName.set(m.name, m);
  if (byName.size === 0) return text;

  const names = [...byName.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const pattern = new RegExp(`@(${names.join("|")})(?![\\p{L}\\p{N}])`, "gu");

  return text.replace(pattern, (_, name: string) => mentionToken(byName.get(name)!));
}

/** API text → field text and the mentions in it (for editing a comment). */
export function decodeMentions(text: string): { text: string; mentions: Mention[] } {
  const mentions: Mention[] = [];
  const decoded = text.replace(tokenRegExp(), (_, name: string, id: string) => {
    if (!mentions.some((m) => m.id === id && m.name === name)) mentions.push({ id, name });

    return `@${name}`;
  });

  return { text: decoded, mentions };
}

/** Parts of a comment to render: plain text and mentions. */
export function splitMentions(text: string): CommentPart[] {
  const parts: CommentPart[] = [];
  let last = 0;

  for (const match of text.matchAll(tokenRegExp())) {
    if (match.index > last) parts.push({ type: "text", text: text.slice(last, match.index) });
    parts.push({ type: "mention", name: match[1], id: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });

  return parts;
}
