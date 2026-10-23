# ADR-0039: A mention is a `@[Name](userId)` token in the comment text and notifies the person

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** `entity.ParseMentions` and `entity.CommentExcerpt` in `server/internal/domain/entity/`, comment services in `server/internal/application/service/task/`, `CommentText` in the API contract, `CommentInput`, `CommentItem` and `shared/utils/mentions.ts` in `web/src/`

## Context

Mentions go with notifications in [ADR-0004](0004-lightweight-tracker-scope.md); comments are plain
text ([ADR-0028](0028-task-activity-feed.md)). A mention must survive a renamed user and stay readable
where tokens are not rendered (an email, an old client).

## Decision

- A mention is the token `@[<name>](<user UUID>)` inside the comment text: the name is 1–100
  characters without `]` and line breaks. The comment stays plain text; the token counts in the
  10 000-character limit.
- The server finds tokens with `entity.ParseMentions` (regular expression
  `@\[([^\]\n]{1,100})\]\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)`), lower-cases the IDs and drops duplicates.
- A mentioned member of the task's project, except the author, gets the notification `mentioned`
  ([ADR-0038](0038-notifications.md)) when the comment is written, and when an edit adds them.
  A token of a non-member stays in the text and notifies nobody; it is not an error.
- Notification and email texts show a mention as `@<name>` (`entity.CommentExcerpt`).
- The web suggests project members after `@` in the comment field and shows `@Name` there; it turns
  them into tokens on sending and back on editing (`encodeMentions`, `decodeMentions`). A comment
  shows a token as a highlighted `@Name` with the name from the token.

## Alternatives

- `@username` — names are not unique and may be empty; an email as the handle shows addresses to
  everyone reading the comment.
- Markup with a rich editor — a heavy dependency for one feature, and comments stop being plain text.
