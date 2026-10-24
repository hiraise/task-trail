# ADR-0043: Tasks merge into a `release/X.Y.Z` branch; merging it into `main` tags `vX.Y.Z`

- **Status:** Accepted
- **Date:** 2026-10-24
- **Affects:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `ci` and `pr-base` in `scripts/dev.sh`, `.github/dependabot.yml`, `.claude/skills/step/`, `.claude/skills/pr/`, `.claude/skills/merge/`, `.claude/skills/release/`, CLAUDE.md "Branches and PRs", README «Установка на свой сервер» and «Разработка»

## Context

Every task used to merge straight into `main`, and a release was a tag pushed by hand. The customer
wants tasks collected into a release first, so that `main` holds only released code.

## Decision

- `main` accepts PRs only from `release/X.Y.Z` branches (semver, no `v`); `scripts/dev.sh pr-base`
  fails CI of any other PR into `main`.
- Cut a release branch from a fresh `origin/main` when the customer names the version:
  `git push origin origin/main:refs/heads/release/X.Y.Z`.
- A task branch starts from the open release branch, and its PR targets that branch. The open
  release is the only `release/*` branch on `origin`; none or several — ask the customer.
- An urgent fix after a release is a patch release: `release/X.Y.Z+1` from `main`, the fix PR into it,
  then into `main`. Another open release branch then takes `main` through a PR `main` → `release/…`.
- A release branch changes only through PRs with a green «Проверка»: a GitHub ruleset on
  `refs/heads/release/*` requires both, as the branch protection of `main` does.
- The customer merges PRs into a release branch and into `main`; an agent does so only on request
  (`/merge`), with a merge commit.
- After the release PR is merged, `release.yml` tags `vX.Y.Z` on its merge commit, publishes the images
  and the GitHub release (ADR-0042); then delete the release branch. Do not push version tags by hand.
- The release PR description opens the release notes; GitHub appends the list of merged PRs. It names
  what the "Consequences" of ADR-0042 require: migrations, `deploy/compose.yaml` changes, new
  required variables.
- Dependabot opens PRs into `main`; retarget one to the open release branch before merging:
  `gh pr edit <N> --base release/X.Y.Z`.
- Run CI on every PR and on push to `main` and `release/**`.

## Consequences

- A tag created with `GITHUB_TOKEN` starts no other workflow, so tagging and building are one job.
- The ruleset blocks `gh pr update-branch` of a release PR: a release branch behind `main` is
  updated through a PR `main` → `release/X.Y.Z`.

## Verification

`pr-base` in `scripts/dev.sh`, run by CI on every PR.

## Alternatives

- One long-lived `develop` branch — the customer chose a branch per release: its version is known
  in advance.
- A fix PR straight into `main` — the customer chose one path for every change.
- A tag pushed by hand after the merge — an extra step; the version is already in the branch name.
