# How to write an ADR

When an ADR is needed and when a rule goes into a code comment instead — [CLAUDE.md](../../CLAUDE.md),
"When an ADR is needed". ADRs are read mostly by agents, in every task that falls under the ADR's
"Affects". So an ADR is short and checkable.

- File name — `docs/adr/NNNN-slug.md`, the next free number; numbers are never reused.
  Add the new ADR to the index [README.md](README.md) right away.
- The free number also counts branches of parallel sessions: after `git fetch`, `scripts/dev.sh rules`
  checks it against `origin` branches and local branches of other worktrees not yet merged
  into `main`. On a clash the number stays with the ADR that reached `main` or an open PR first.
  Rename yours: the file, the index row, `ADR-NNNN` references in code, docs and scripts.
- The title states the decision itself ("Access by three fixed roles", not "About roles").
- One decision per ADR, about 30 lines. No discussion history and no retelling of the code — use
  paths and identifiers in `backticks` instead, so search finds them.
- "Decision" — checkable rules in the imperative mood, one rule per bullet.
- "Affects" — only the places where a change can break the decision: an agent finds the ADR for its
  task by them. The index row repeats the title, status and "Affects" verbatim —
  `scripts/rules.mjs` checks this.
- A rule that a code search can catch goes into `scripts/rules.mjs`; name the check in one line
  under "Verification".
- A decision the customer did not ask for gets the status `Proposed` and becomes `Accepted` only after
  the customer agrees. Summarize it for the customer in Russian in the chat (ADR-0031).
- Replacing part of an ADR — put a link to the new ADR next to the replaced bullet of the old one.
  When an ADR collects a second partial replacement, write a consolidated ADR that supersedes it
  entirely: otherwise the rule in force has to be assembled from several documents.

## Template

Copy the block into a new file and fill it in; delete an optional section if there is nothing to say.

```markdown
# ADR-NNNN: <The decision in one phrase — the title alone should tell what was decided>

- **Status:** Proposed | Accepted | Superseded by [ADR-NNNN](NNNN-slug.md) | Deprecated
- **Date:** YYYY-MM-DD
- **Affects:** <where a change can break the decision: paths, packages, files>
- **Supersedes:** [ADR-NNNN](NNNN-slug.md) <!-- delete the line if the ADR supersedes nothing -->

## Context

<1–2 sentences: the problem or constraint that called for the decision.>

## Decision

<Checkable rules in the imperative mood: one rule per bullet.>

- …

## Consequences

<Optional: what to keep in mind for future changes, if it does not follow from the rules.>

## Verification

<Optional: a check in `scripts/rules.mjs` or a test — in one line.>

## Alternatives

<Optional: a rejected option an agent may suggest again — why not, in one line.>
```
