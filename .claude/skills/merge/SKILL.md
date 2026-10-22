---
name: merge
description: Merging a TaskTrail PR into main at the customer's request («влей», «вливай», «слей», «мержи») — a fresh branch, green CI, a merge commit, cleanup of the branch and worktree, CI on main. Use only when the customer has asked to merge the PR.
---

# Merging a PR

Rules — [CLAUDE.md](../../../CLAUDE.md), "Branches and PRs": the customer merges PRs; the agent does
so only at the customer's request and with green CI. This file gives the order. A Dependabot PR is
merged the same way; Dependabot deletes its branch itself.

## 1. Before merging

1. The customer's request is about this exact PR. The number is unclear — `gh pr list` and ask.
2. `gh pr view <N> --json state,isDraft,mergeStateStatus` — the PR is open and not a draft.
3. `main` is protected and accepts only a branch that is up to date with it. `mergeStateStatus` is
   `BEHIND`: `gh pr update-branch <N>`, then wait for CI again.
4. `gh pr checks <N> --watch` — in the background. A green «Проверка» on the latest commit is
   required. It failed — `gh run view <id> --log-failed`, fix it in the branch (the `/pr` skill,
   section 4) and come back here. No checks after a couple of minutes — GitHub did not start CI:
   `gh pr close <N> && gh pr reopen <N>`.

## 2. Merging

`gh pr merge <N> --merge` — a regular merge commit, like all PRs of the project: the branch commits
stay in history with their messages. No squash, no rebase. Permissions do not allow it — give the
customer the command `! gh pr merge <N> --merge`.

## 3. Cleanup

1. The branch still exists on GitHub (`git ls-remote --heads origin <branch>`) —
   `git push origin --delete <branch>`.
2. `scripts/dev.sh cleanup` removes worktrees of merged PRs, but not the one that holds the running
   script. So run the script of the main folder — it is the first in `git worktree list`:
   `bash <main folder>/scripts/dev.sh cleanup`. If that script has no `cleanup` command (an old checkout),
   remove the worktree manually: the folder is clean (`git -C <folder> status --porcelain` is empty) →
   `git worktree remove <folder>`, `git branch -D <branch>`.
3. The merged branch is checked out in the main folder and the folder is clean —
   `git switch main && git pull --ff-only`, then `git branch -d <branch>`. Uncommitted changes —
   do not touch them, tell the customer.

## 4. After merging

1. `gh run list --workflow ci.yml --branch main --limit 1` — CI on `main` for the merge commit,
   wait for the result. Failed — tell the customer and fix it in a separate PR.
2. Tell the customer, in Russian: the PR is merged (the merge commit), what was cleaned up, the CI
   result on `main`.
