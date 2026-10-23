---
name: pr
description: Hand-off of a TaskTrail task — checks, showing the result to the customer, a PR only after the customer approves, CI. Use when a task is done and it is time to show it.
---

# Task hand-off

Rules — [CLAUDE.md](../../../CLAUDE.md), "Build and checks" and "Branches and PRs". This file gives
the order.

## 1. Before showing

1. Everything agreed with the customer is done, not part of it. Split the work into stages
   only if the customer agreed to that.
2. Documentation in the same change: README, ADR (a decision the customer did not ask for —
   with the status `Proposed`), comments for rules of a single screen or function.
3. `git fetch`, then `scripts/dev.sh check` — green. After the fetch, `rules` checks the numbers
   of new ADRs against branches of parallel sessions; on a clash — follow the
   [ADR template](../../../docs/adr/template.md).

## 2. Showing

1. The change is visible in the UI or API — bring up the local stack `scripts/dev.sh up`, run
   `scripts/dev.sh smoke` ([ADR-0010](../../../docs/adr/0010-local-development.md)) and check the
   scenario yourself before calling the customer. Screens — with `/ui-check`, not with screenshots
   in this session ([ADR-0040](../../../docs/adr/0040-agent-context-economy.md)). A `server/` change that the web client does not
   show yet — in the local stack's Swagger (`/api/docs/`), with tests and the `scripts/dev.sh check`
   output.
2. Tell the customer briefly, in Russian: what changed, where to find it (screen, action, URL), what
   to look at; which ADRs await a decision.
3. Wait for "yes". Feedback — fix it, run `check` again and show again.

## 3. PR

1. Commits — in English, split by the meaning of the change; `git push -u origin <branch>`.
2. The PR title and description — in English. Write the description in a file in the scratchpad,
   following the sample below: `gh pr create --base main --title "<what changed>" --body-file <file>`.
3. Replace the description entirely from the file:
   `gh api -X PATCH repos/hiraise/task-trail/pulls/<N> -F body=@<file>`.

```markdown
<One or two sentences: what the user or developer can do now.>

## What changes

- <one bullet per notable change; links to ADRs>

<ADRs: which were added and with what status, or why none are needed. README updated — if it was.>

## Verification

- `scripts/dev.sh check` is green; <which tests were added or changed>.
- The customer reviewed the result and approved it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. CI and after

1. `scripts/dev.sh ci <N>` with `run_in_background: true` — one notification when CI finishes; do not
   poll with `sleep` or `gh pr checks`. Failed — the output has the log before the first error: repeat
   the step locally with the same `scripts/dev.sh` command, fix, push, wait again.
2. Give the customer, in Russian, the PR link and the CI result, and say the context can be cleared
   (`/clear`): the next step starts from the repository
   ([ADR-0032](../../../docs/adr/0032-one-session-plan-steps.md)), and `/merge <N>` and
   `/code-review <N>` do not need this chat. The customer merges the PR.
3. The customer asks to merge the PR — the `/merge` skill with the PR number: it runs in its own
   context, relay its result. The customer merged it themselves — `scripts/dev.sh cleanup` of the
   main folder removes the worktree and the branch.
