---
name: release
description: TaskTrail releases — opening a release branch release/X.Y.Z for a version the customer names («открой релиз 1.1.0», «патч-релиз»), or shipping the open release into main («выпускай релиз», «релиз в main») with a release PR and its notes. Argument — the version to open, or «ship».
---

# Releases

Rules — [ADR-0043](../../../docs/adr/0043-release-branches.md) (branches) and
[ADR-0042](../../../docs/adr/0042-release-images-and-compose.md) (images, release notes). Talk to the
customer in Russian.

## Opening a release

1. The version — from the customer, semver without `v`. Not named: the latest tag
   (`git fetch --tags`, `git tag -l 'v*' --sort=-v:refname | head -1`) plus a minor for new features,
   a patch for an urgent fix; ask the customer to confirm it.
2. `git fetch`; the tag `vX.Y.Z` and the branch `release/X.Y.Z` do not exist yet. Then
   `git push origin origin/main:refs/heads/release/X.Y.Z`.
3. Another release branch is open — two are open now, and a step asks the customer which one to use.
   After the patch release ships, the other branch takes `main` through `/merge` (its section 1).
4. Tell the customer: the branch is open, task PRs now target it.

## Shipping a release

1. `git fetch`; the open release branch — the only one in `git ls-remote --heads origin 'release/*'`,
   otherwise ask. `git log --oneline origin/main..origin/release/X.Y.Z` is not empty.
   `gh pr list --base release/X.Y.Z` — open task PRs: ask the customer whether the release waits for them.
2. What an administrator needs to know, from
   `git diff --stat origin/main...origin/release/X.Y.Z -- server/migrations deploy/compose.yaml server/README.md`:
   new migrations and whether the previous version still runs on the migrated database, changes of
   `deploy/compose.yaml`, new required environment variables.
3. Write the release PR description in English to a file in the scratchpad — it opens the release
   notes, GitHub appends the merged PRs:

   ```markdown
   <What is new for users, one or two sentences.>

   ## Upgrade

   - <migrations; whether the previous version runs on the migrated database — or "No migrations.">
   - <changes of deploy/compose.yaml and new required variables — or "No changes to deploy/compose.yaml or the environment.">

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

4. Show the customer: the version, what goes in, the notes. After «да» —
   `gh pr create --base main --head release/X.Y.Z --title "Release X.Y.Z" --body-file <file>`, then
   `scripts/dev.sh ci <N>` with `run_in_background: true`.
5. Give the customer the PR link and the CI result. The customer merges it, or asks for `/merge <N>`:
   after the merge `release.yml` tags `vX.Y.Z` and publishes the images and the GitHub release.
