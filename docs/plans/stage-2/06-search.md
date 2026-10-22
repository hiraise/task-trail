# Step 6 — search

Read first: [ADR-0030](../../adr/0030-search-by-substring.md), the stage [README](README.md).
Steps 1–5 must be merged.

## Repositories

Search methods reuse the list queries of their repositories with an extra condition — do not write
a separate search repository:

- `ProjectRepository.Search(viewerID, pattern, limit)` *(new)* → `[]*ProjectView`: `projectViews` plus
  `AND (p.name ILIKE $p ESCAPE '\' OR p.key ILIKE $p ESCAPE '\')`, both active and archived, by name.
- `BoardRepository.Search(viewerID, pattern, limit)` *(new)* → `[]*BoardView`: the `ListViews` query
  plus `b.name ILIKE …`, by name.
- `TaskRepository.Search(viewerID, pattern, key *TaskKeyQuery, limit)` *(new)* → `[]*entity.Task`:
  tasks of the viewer's projects (not deleted; archived included) where name, description or
  `p.key || '-' || t.number` match the pattern. With `key` set, an exact match
  (`p.key = $key AND t.number = $number`) comes first, then the rest by `t.updated_at DESC, t.id`.
- `pattern` is `%` + escaped `q` + `%`; escaping —
  `strings.NewReplacer("\\", "\\\\", "%", "\\%", "_", "\\_")`.
- `limit` is 20.

## Module `application/service/search/` *(new)*

- `SearchService.Execute(ctx, userID, q)`:
  - trims `q`;
  - recognizes a task key: `^(\p{L}[\p{L}0-9]{1,9})-(\d+)$` → `TaskKeyQuery{Key: strings.ToUpper(…),
    Number: …}`;
  - calls the three repository methods and returns the three lists.
- Handler `v1/search.go` *(new)*: reads `q` from the query string; empty after trimming or longer than
  100 characters → `422` with `details.q`.

## Contract

- A top-level tag `search`.
- Operation `search` — `GET /v1/search`, query parameter `q` (string, 1–100 characters).
- Response `SearchResult { projects: Project[], boards: Board[], tasks: Task[] }` — the same shapes as
  the lists.

## Tests

- Another user's project, board or task is never found.
- Case does not matter, Latin and Cyrillic (`альф` finds «Проект Альфа»).
- `%` and `_` are matched as characters.
- `ds-12` finds task `DS-12` first.
- Archived items come with `archivedAt` / `projectArchived`.
- Empty and too long `q` → `422`.

## Web

- Move search from `presentation/shared/components/Search/` to `presentation/features/search/` as
  one adaptive `SearchPage`; `SearchDesktopPage` + `SearchMobilePage` go away. Lower
  `DEVICE_SPLIT_LIMIT`.
- The input has `maxLength={100}`.
- `useDebouncedValue` *(new)*, 300 ms; `useSearch(q)` *(new)* queries when at least one character is
  left after trimming.
- Groups «Проекты», «Доски», «Задачи» collapse (frames `1897:183080`, `1220:96797`, `1220:100069`).
  Cards: `ProjectCard`, `BoardListItem`, and a task row — key, name, avatar.
- `HighlightedText` *(new)* highlights case-insensitive occurrences of `q` in names.
- Empty input — the picture and «Чтобы что-то нашлось, нужно что-то ввести. Пока что тут пусто»
  (`1895:131467`).
- Nothing found — «Ничего не найдено, попробуйте переформулировать запрос» (`1897:185463`,
  `1220:103914`).
- On a phone the keyboard opens at once, «Отмена» goes back, no bottom bar (comment `1220:96792`).
- Archived items carry the «Архив» tag.

## Stack

Smoke searches for the smoke task by its key and by part of its name.

## After this step

Stage 2 is complete: update the root `README.md` (in Russian: features, the line about the current
stage, «План») and «Where we are» in the roadmap.

## Done when

Common criteria from the stage README.

## Show the customer

Search across the three groups, highlighting, search by key, archived items.
