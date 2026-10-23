# Step 16 — mentions in the web, and the end of stage 3

Read first: [ADR-0039](../../adr/0039-comment-mentions.md), the stage [README](README.md), artboards B and
G in [00-mockups.md](00-mockups.md). Step 15 must be merged. Names marked *(new)* do not exist yet.

## Helpers — `web/src/shared/utils/mentions.ts` *(new)*, with `mentions.test.ts`

The comment field shows `@Name`; the API stores `@[Name](userId)` (ADR-0039). Pure functions do the
conversion:

```ts
export interface Mention { id: UserId; name: string }

/** The token for the API: names lose `]` and line breaks, at most 100 characters. */
export const mentionToken = (m: Mention) => `@[${cleanName(m.name)}](${m.id})`;

/**
 * Field text → API text: each `@Name` of a picked mention becomes its token. Longer names are replaced
 * first, so «@Анна Петрова» wins over «@Анна». A mention whose `@Name` was erased is dropped.
 */
export function encodeMentions(text: string, mentions: Mention[]): string;

/** API text → field text and the mentions in it (for editing a comment). */
export function decodeMentions(text: string): { text: string; mentions: Mention[] };

/** Parts of a comment to render: plain text and mentions. */
export type CommentPart = { type: "text"; text: string } | { type: "mention"; name: string; id: UserId };
export function splitMentions(text: string): CommentPart[];
```

Use the same regular expression as the server: `/@\[([^\]\n]{1,100})\]\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)/g`.
Tests: encode and decode round-trip; two mentions with a shared prefix; an erased mention; text with
`[` and `]` that is not a token; `splitMentions` of a comment with a link and a mention.

## Mention suggestions — `CommentInput`

`features/tasks/components/TaskActivity/CommentInput.tsx` gets `members: ProjectMember[]` and keeps
`mentions: Mention[]` in its state. `TaskActivity` reads `useProjectMembers(task.projectId)` and passes
`members` to its `CommentInput` and to `CommentItem` (a new prop), which renders `CommentInput` when a
comment is edited.

- After `@` at the start of the text or after a space, with 0–30 more characters without a line break
  before the caret, show a list under the field (`@floating-ui/react`, already a dependency — like
  `DropdownMenu`) of members whose display name or email contains the typed part, case-insensitively, at
  most 6, each with `UserAvatar` and the name.
- `ArrowUp`/`ArrowDown` move the highlight, `Enter` or `Tab` or a click inserts `@<display name> ` in place
  of `@<typed part>` and adds `{ id, name }` to `mentions`; `Escape` closes the list and calls
  `event.stopPropagation()` (otherwise the kanban `TaskModal` closes). While the list is open, `Enter`
  does not send the comment.
- On submit: `onSubmit(encodeMentions(text, mentions))`; then clear `mentions`.
- Editing a comment: `initialValue` goes through `decodeMentions`, its mentions seed the state;
  `handleCancel` resets to the decoded text and mentions, not to the raw `initialValue`.
- Put the suggestion logic in a hook `useMentionSuggestions(text, caret, members)` *(new)* next to the
  component and test it (the trigger rules, filtering, insertion); a small component test for the
  keyboard flow.

## Showing mentions — `CommentItem`

Render `splitMentions(comment.text)`: text parts go through `linkify` as now; a mention is
`<span className={styles.mention}>@{name}</span>` (`--text-accent`, `body-med-2` or as in artboard G).
Add a test: a comment with a mention shows «@Анна Петрова» and no brackets or UUID.

## Notifications

`describeNotification` already handles `mentioned` (step 14); the notification `text` comes from the server
with `@Name` (step 15).

## The end of the stage

- Root `README.md` (Russian): features of stage 3 in the paragraph about what the stack implements
  (priority, due date, labels, subtasks, attachments, notifications with emails and reminders, mentions);
  the line about the current stage («Этап 3 закрыт…»); «План» — stage 3 done, the next one; the `smoke`
  line if smoke grew.
- `docs/roadmap.md`: «Where we are» — stage 3 done with the date and links to ADR-0033…0039, «Next» —
  ask the customer (stage 4 is the Android client, or items outside the stages); «Stages» — stage 3
  done; «Deferred» — remove «Mentions in comments».
- This plan's README: step 16 `done`.

## Stack

On the stack: type `@` in a comment, pick a member with the keyboard and with a click, send, see the
highlighted mention; edit the comment (the mention stays); the mentioned user sees «упомянул(а) вас» in
the notifications.

## Done when

Common criteria from the stage README; README and roadmap updated.

## Show the customer

Mentions with suggestions on a phone and a desktop, the comment view, the notification of the mentioned
user; then the whole stage 3 summary.
