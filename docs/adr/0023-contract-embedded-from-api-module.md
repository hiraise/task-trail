# ADR-0023: Сервер встраивает контракт из Go-модуля `api/`, а не из копии

- **Статус:** Принято
- **Дата:** 2026-10-21
- **Затрагивает:** `api/go.mod`, `api/openapi.go`, `server/go.mod`, `server/docker/`, Swagger в `server/internal/presentation/http/docs.go`

## Контекст

Swagger показывает администратору контракт `api/openapi.yaml` ([ADR-0005](0005-monorepo-api-contract.md),
[ADR-0014](0014-service-administrator.md)), и сервер должен нести его в бинарнике. Но `go:embed`
не берёт файлы вне Go-модуля, а контракт лежит не в `server/`.

## Решение

- `api/` — Go-модуль `task-trail/api`: `api/openapi.go` встраивает `openapi.yaml` в `api.OpenAPI`.
- `server/go.mod` подключает его через `replace task-trail/api => ../api`; версий и тегов у модуля нет.
- Копию контракта в `server/` не заводи: файл `openapi.yaml` есть только в `api/`.
- Образ сервера собирай из корня репозитория: `docker build -f server/docker/Dockerfile .`;
  что попадает в контекст сборки — `server/docker/Dockerfile.dockerignore`.

## Последствия

- Изменил контракт — Swagger сервера меняется с ним же, отдельного шага нет.
- Стенд на шаге 5 этапа 1 собирает сервер с контекстом — корнем репозитория.

## Проверка

`scripts/rules.mjs`: файл `openapi.yaml` есть только в `api/`.

## Альтернативы

- Копия в `server/` со сверкой в тестах — второй файл в каждом изменении контракта и шаг синхронизации.
- Чтение файла с диска — путь в окружении, а ADR-0015 новых переменных не допускает.
