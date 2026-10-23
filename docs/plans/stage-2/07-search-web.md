# Step 7 — search in the web

Read first: [ADR-0030](../../adr/0030-search-by-substring.md), the stage [README](README.md).
Step 6 must be merged: `GET /v1/search` and its types in `web/src/infrastructure/api/generated/`
exist.

## Web

- `SearchRepository` *(new)* in `domain/repositories/`, `apiSearchRepository` *(new)*, the address in
  `apiRoutes.ts`, mapping of `SearchResult` in `mappers.ts` with the existing project, board and task
  mappers (ADR-0024).
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

## After this step

Stage 2 is complete: update the root `README.md` (in Russian: features, the line about the current
stage, «План») and «Where we are» in the roadmap.

## Done when

Common criteria from the stage README.

## Show the customer

Search across the three groups, highlighting, search by key, archived items.
