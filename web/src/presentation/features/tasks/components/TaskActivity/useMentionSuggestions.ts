import { useMemo, useState } from "react";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import { getUserDisplayName } from "@/domain/models/User";
import type { Mention } from "@/shared/utils/mentions";

/** `@` and the typed part before the caret: `text.slice(start, end)` is replaced on a pick. */
export interface MentionTrigger {
  start: number;
  end: number;
  query: string;
}

const SUGGESTION_LIMIT = 6;

// `@` at the start or after a space, then 0–30 characters without a line break or another `@`
const TRIGGER = /(^|\s)@([^\n@]{0,30})$/;

/** The mention being typed right before the caret, if any (ADR-0039). */
export function findMentionTrigger(text: string, caret: number): MentionTrigger | null {
  const match = TRIGGER.exec(text.slice(0, caret));

  if (!match) return null;

  return { start: match.index + match[1].length, end: caret, query: match[2] };
}

/** Members whose display name or email contains the query, case-insensitively; at most 6. */
export function filterMembers(members: ProjectMember[], query: string): ProjectMember[] {
  const q = query.toLocaleLowerCase();

  return members
    .filter(
      (m) =>
        getUserDisplayName(m).toLocaleLowerCase().includes(q) ||
        m.email.toLocaleLowerCase().includes(q),
    )
    .slice(0, SUGGESTION_LIMIT);
}

/** Puts `@<display name> ` in place of `@<typed part>`; the caret goes after the space. */
export function insertMention(
  text: string,
  trigger: MentionTrigger,
  member: ProjectMember,
): { text: string; caret: number; mention: Mention } {
  const name = getUserDisplayName(member);
  const inserted = `@${name} `;

  return {
    text: text.slice(0, trigger.start) + inserted + text.slice(trigger.end),
    caret: trigger.start + inserted.length,
    mention: { id: member.id, name },
  };
}

/**
 * The member suggestion list of the comment field: open while a mention is typed before the caret
 * and some member matches it. Escape closes it until the caret leaves this `@`.
 */
export function useMentionSuggestions(text: string, caret: number, members: ProjectMember[]) {
  const trigger = useMemo(() => findMentionTrigger(text, caret), [text, caret]);
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);
  const [highlight, setHighlight] = useState({ query: "", index: 0 });

  // Leaving the `@` forgets the dismissal: the next `@` opens the list again
  if (!trigger && dismissedAt !== null) setDismissedAt(null);

  const items = useMemo(
    () => (trigger && trigger.start !== dismissedAt ? filterMembers(members, trigger.query) : []),
    [trigger, dismissedAt, members],
  );
  const open = items.length > 0;
  // A new query highlights the first row again
  const active =
    trigger && highlight.query === trigger.query ? Math.min(highlight.index, items.length - 1) : 0;

  return {
    open,
    items,
    active,
    /** Moves the highlight by `delta` rows, wrapping around */
    move: (delta: number) => {
      if (!open || !trigger) return;
      setHighlight({ query: trigger.query, index: (active + delta + items.length) % items.length });
    },
    dismiss: () => {
      if (trigger) setDismissedAt(trigger.start);
    },
    /** The field text after picking `member`; null when no mention is being typed */
    pick: (member: ProjectMember) => (trigger ? insertMention(text, trigger, member) : null),
  };
}
