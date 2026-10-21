# ADR-0007: Сервер — слои DDD, домен не зависит от остальных слоёв

- **Статус:** Принято
- **Дата:** 2026-10-21
- **Затрагивает:** `server/internal/`, `server/test/mocks/`

## Контекст

Сервер переписан по слоям DDD (переработка мая 2026). Фиксируем правила, чтобы новые модули —
проекты, задачи, доски — строились так же.

## Решение

- `internal/domain` — сущности, их правила, интерфейсы репозиториев и сервисов, ошибки `DomainError`.
- `internal/application` — сценарии: один сервис на операцию, сборка модуля в одном конструкторе
  (как `access.New`).
- `internal/infrastructure` — PostgreSQL, JWT, почта; `internal/presentation` — HTTP (Gin).
- `domain` не импортирует `application`, `infrastructure` и `presentation`;
  `application` не импортирует `infrastructure` и `presentation`. Тестам (`_test.go`) можно:
  они собирают сценарий с настоящими вспомогательными сервисами, например генератором ID.
- Правила и инварианты — в методах сущностей, а не в обработчиках HTTP и не в SQL.
- Сценарий, меняющий данные, выполняется в `TxManager.DoWithTx`.
- Сценарий возвращает `DomainError` с кодом; HTTP-статус по коду выбирает
  `presentation/http/middleware/error.go`.
- Сценарии тестируются с моками из `test/mocks` (`make mock`), репозитории — интеграционными
  тестами на PostgreSQL.

## Проверка

Проверка импортов появится в `scripts/rules.mjs` после исправления единственного нарушения
в коде (не в тестах): `internal/domain/service/access_token.go` импортирует `internal/application/dto`.
