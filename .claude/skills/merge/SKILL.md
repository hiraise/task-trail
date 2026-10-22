---
name: merge
description: Слияние PR TaskTrail в main по просьбе заказчика («влей», «вливай», «слей», «мержи») — свежая ветка, зелёный CI, merge-коммит, уборка ветки и worktree, CI на main. Используй, только когда заказчик сам попросил влить PR.
---

# Слияние PR

Правила — [CLAUDE.md](../../../CLAUDE.md), «Ветки и PR»: сливает PR заказчик, агент — только по его
просьбе и при зелёном CI. Здесь — порядок. PR Dependabot сливается так же, свою ветку он удаляет сам.

## 1. Перед слиянием

1. Просьба заказчика касается именно этого PR. Номер не ясен — `gh pr list` и уточни.
2. `gh pr view <N> --json state,isDraft,mergeStateStatus` — PR открыт и не черновик.
3. `main` защищён и принимает только ветку, свежую относительно него. `mergeStateStatus` —
   `BEHIND`: `gh pr update-branch <N>`, затем снова жди CI.
4. `gh pr checks <N> --watch` — в фоне. Нужна зелёная «Проверка» на последнем коммите. Упала —
   `gh run view <id> --log-failed`, почини в ветке (скилл `/pr`, раздел 4) и вернись сюда.
   Проверок нет через пару минут — GitHub не запустил CI: `gh pr close <N> && gh pr reopen <N>`.

## 2. Слияние

`gh pr merge <N> --merge` — обычным merge-коммитом, как все PR проекта: коммиты ветки остаются
в истории со своими сообщениями. Не squash и не rebase. Разрешения не пускают — дай заказчику
команду `! gh pr merge <N> --merge`.

## 3. Уборка

1. Ветка ещё есть на GitHub (`git ls-remote --heads origin <ветка>`) — `git push origin --delete <ветка>`.
2. Worktree слитых PR убирает `scripts/dev.sh cleanup`, но не тот, в котором лежит запущенный
   скрипт. Поэтому запускай скрипт основной папки — она первая в `git worktree list`:
   `bash <основная папка>/scripts/dev.sh cleanup`. Там ещё нет команды `cleanup` — убери worktree
   вручную: папка чистая (`git -C <папка> status --porcelain` пуст) → `git worktree remove <папка>`,
   `git branch -D <ветка>`.
3. Слитая ветка стоит в основной папке и папка чистая — `git switch main && git pull --ff-only`,
   затем `git branch -d <ветка>`. Незакоммиченные правки — не трогай, скажи заказчику.

## 4. После слияния

1. `gh run list --workflow ci.yml --branch main --limit 1` — CI на `main` по коммиту слияния,
   дождись итога. Упал — скажи заказчику и почини отдельным PR.
2. Скажи заказчику: PR влит (коммит слияния), что убрано, итог CI на `main`.
