---
name: merge
description: Merging a TaskTrail PR at the customer's request («влей», «вливай», «слей», «мержи») — a task PR into its release branch or a release PR into main; green CI, a merge commit, cleanup of the branch and worktree, CI after the merge and, for a release, the published release. Use only when the customer has asked to merge the PR; pass the PR number as the argument. Runs in its own context (ADR-0040).
context: fork
agent: general-purpose
model: sonnet
background: false
---

# Merging a PR

You run in a separate context without the chat ([ADR-0040](../../../docs/adr/0040-agent-context-economy.md)).
The argument: `$ARGUMENTS` — the PR number. Rules — [CLAUDE.md](../../../CLAUDE.md), "Branches and
PRs": the customer merges PRs; an agent does so only at the customer's request and with green CI.
Branches — [ADR-0043](../../../docs/adr/0043-release-branches.md): task PRs go into the open
`release/X.Y.Z`, only a release PR goes into `main`. A Dependabot PR is merged the same way;
Dependabot deletes its branch itself.

Your last message is the result the main session relays to the customer: write it in Russian, in
3–5 lines. Stop with such a message at any point where the customer must decide.

## 1. Before merging

1. The number: the argument; empty — `gh pr view --json number` of the current branch. Still
   unclear — stop and return `gh pr list` with the question «Какой PR влить?».
2. `gh pr view <N> --json state,isDraft,mergeStateStatus,baseRefName,headRefName` — the PR is open
   and not a draft.
3. The base is `main`, the head is not `release/X.Y.Z`: a Dependabot PR — retarget it to the open
   release branch (the only one in `git ls-remote --heads origin 'release/*'`):
   `gh pr edit <N> --base release/X.Y.Z`; any other — stop and ask the customer.
4. `main` and `release/*` are protected and accept only a branch that is up to date with them.
   `mergeStateStatus` is `BEHIND`: a task branch — `gh pr update-branch <N>`; a release branch is
   protected too, so open a PR `gh pr create --base release/X.Y.Z --head main --title "Sync
   release/X.Y.Z with main" --body "Takes the patch release from main (ADR-0043)."`, wait for its
   CI and merge it as in section 2, then come back to the release PR.
5. `scripts/dev.sh ci <N>` — it waits for CI and prints one line per check. A green «Проверка» on
   the latest commit is required. Failed — stop and return the failure from the output: the fix is
   made in the PR's branch by the main session (the `/pr` skill, section 4).

## 2. Merging

`gh pr merge <N> --merge` — a regular merge commit, like all PRs of the project: the branch commits
stay in history with their messages. No squash, no rebase. Permissions do not allow it — return
the command `! gh pr merge <N> --merge` for the customer.

## 3. Cleanup

1. The branch still exists on GitHub (`git ls-remote --heads origin <branch>`) and is not `main` —
   `git push origin --delete <branch>`. A release branch is deleted too: the release workflow works
   from the merge commit.
2. `scripts/dev.sh cleanup` removes worktrees of merged PRs, but not the one that holds the running
   script. So run the script of the main folder — it is the first in `git worktree list`:
   `bash <main folder>/scripts/dev.sh cleanup`. If that script has no `cleanup` command (an old checkout),
   remove the worktree manually: the folder is clean (`git -C <folder> status --porcelain` is empty) →
   `git worktree remove <folder>`, `git branch -D <branch>`.
3. The merged branch is checked out in the main folder and the folder is clean —
   `git -C <main folder> switch main && git -C <main folder> pull --ff-only`, then
   `git -C <main folder> branch -d <branch>`. Uncommitted changes — do not touch them, say so.

## 4. After merging

1. `scripts/dev.sh ci <base>` — CI of the base branch (`release/X.Y.Z` or `main`) for the merge
   commit. Failed — say so: it is fixed in a separate PR into the release branch.
2. A release PR: the workflow `release.yml` tags `vX.Y.Z` and publishes the images and the GitHub
   release. Its run: `gh run list --workflow release.yml --limit 3 --json databaseId,headBranch`,
   the one with the release branch; `gh run watch <id> --exit-status --interval 20 >/dev/null`.
   Failed — `gh run view <id> --log-failed | tail -n 40`, return the error. Green —
   `gh release view vX.Y.Z --json url`.
3. The result, in Russian: the PR is merged (the merge commit), what was cleaned up, the CI result;
   for a release — the tag and the link to the GitHub release.
