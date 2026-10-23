# Step 15 — mentions on the server

Read first: [ADR-0039](../../adr/0039-comment-mentions.md), [ADR-0038](../../adr/0038-notifications.md),
[ADR-0028](../../adr/0028-task-activity-feed.md), the stage [README](README.md). Steps 12 and 13 must be
merged. The web part is [step 16](16-mentions-web.md). No migration. Names marked *(new)* do not exist
yet.

## Domain — `entity/mention.go` *(new)*

```go
// mentionToken — @[Name](user UUID) in a comment (ADR-0039).
var mentionToken = regexp.MustCompile(`@\[([^\]\n]{1,100})\]\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)`)

// ParseMentions returns the users mentioned in the text, lower-cased, without duplicates, in order of
// first appearance.
func ParseMentions(text string) []UserID

// MentionsAdded — users mentioned in after but not in before (an edit notifies only them).
func MentionsAdded(before, after string) []UserID
```

Change `CommentExcerpt` (step 12): before collapsing whitespace, replace each token with `@` + its name
(`mentionToken.ReplaceAllString(text, "@$1")`), so notifications and emails read «@Анна Петрова».

The UUID part is strict: a loose `[0-9a-f-]{36}` would let 36 dashes through to `ANY($2::uuid[])` and
fail the request with `500`.

Tests `entity/mention_test.go`: two tokens and a duplicate; upper-case UUID; 36 dashes in place of a UUID
is not a mention; a broken token (`@[Анна](x)`,
a line break inside the name, a 101-character name) is not a mention; `MentionsAdded`; `CommentExcerpt`
with a token.

## Application — task module

- `CreateCommentService` (`service/task/activity.go`), inside its `commentChange` callback after the
  comment is created:
  1. `mentioned := entity.ParseMentions(comment.Text)` minus the author;
  2. keep only members of the task's project with one query:
     `ProjectMemberRepository.FilterMembers(ctx, projectID, ids []entity.UserID) ([]entity.UserID, error)`
     *(new)* in `domain/repository/project_member.go` — `SELECT user_id FROM project_members WHERE
     project_id = $1 AND user_id = ANY($2::uuid[])`; an empty `ids` returns nil without a query;
     regenerate `test/mocks/mock_project_member.go`; a repository test in `persistent/project_test.go`;
  3. `mentioned` notifications to them, `Text = CommentExcerpt(comment.Text)`;
  4. `commented` to `TaskRecipients(task, author)` **minus** the mentioned members — one notification per
     person per comment (ADR-0038).
- `EditCommentService` — after a successful edit: `entity.MentionsAdded(oldText, newText)`, filtered to
  members and without the author → `mentioned` notifications with the new excerpt, time — `now`. An edit
  writes no `commented`.
- Update gomock expectations in the task service tests.

## Contract

`CommentText` description: "Plain text; the server trims spaces at the ends before validation
(ADR-0028). A mention is the token `@[Name](userId)` (ADR-0039)." `NotificationKind` already has
`mentioned` (step 12). Run `npm run api:types` — the generated comments change.

## Handler tests — in `v1/notification_test.go`

- The admin writes «Посмотри, @[Иван](<ivan id>)» on a task where Ivan is the assignee → Ivan has one
  `mentioned` (not `commented`) with the text «Посмотри, @Иван»; the task author gets `commented` if they
  are not the writer.
- A token of a user outside the project → `201`, no notification for them, the text is kept as written.
- Mentioning yourself → nothing.
- An edit adding Maria → Maria gets `mentioned`; an edit that keeps Ivan → Ivan gets nothing new.
- Emails (step 13) of `mentioned` show «@Иван» in the body.

## Stack

Smoke: the admin comments the smoke task mentioning the member by token; the member's newest notification
is `mentioned`.

## Done when

Common criteria from the stage README.

## Show the customer

Swagger: a comment with a mention token and the member's `mentioned` notification; the edit rule; the
tests and the `scripts/dev.sh check` output.
