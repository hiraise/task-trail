# Архитектурные решения (ADR)

Здесь фиксируются архитектурные и важные системные решения проекта. Проект разрабатывают
AI-агенты, поэтому ADR пишутся в первую очередь для них — коротко, с проверяемыми
правилами, — и во вторую очередь для людей. Когда нужен ADR — в [CLAUDE.md](../../CLAUDE.md);
как его писать и шаблон — [template.md](template.md).

Статусы: «Предложено» → «Принято» → «Заменено» или «Отменено». Принятые ADR обязательны;
предложенные ждут согласия заказчика; заменённые и отменённые хранятся для истории —
действует тот ADR, который заменил.

| ADR | Решение | Статус | Затрагивает |
| --- | --- | --- | --- |
| [0001](0001-soft-delete-project.md) | Проект удаляется мягко: `deleted_at` у проекта и у всех его сущностей | Принято | репозитории проектов и задач в `server/internal/infrastructure/repository/persistent/`, `server/migrations/` |
| [0002](0002-task-edit-endpoints.md) | Задача меняется отдельным эндпоинтом на каждую операцию | Принято | эндпоинты задач в `server/internal/presentation/http/v1/`, контракт API |
| [0003](0003-fixed-roles-and-statuses.md) | Доступ по трём фиксированным ролям, статусы задач фиксированы, идентификаторы — UUID | Принято | `server/migrations/`, проверки доступа в `server/internal/`, роли и статусы в контракте API |
| [0004](0004-lightweight-youtrack-scope.md) | TaskTrail — лёгкий YouTrack: поля и статусы задач фиксированы, конструктора нет | Принято | модель данных (`server/migrations/`), контракт API, модели в `web/src/domain/` |
| [0005](0005-monorepo-api-contract.md) | Один репозиторий: сервер, веб-клиент и контракт API `api/openapi.yaml` | Принято | `api/`, HTTP-слой `server/internal/presentation/`, клиент API `web/src/infrastructure/` |
| [0006](0006-tech-stack.md) | Стек: Go, Gin и PostgreSQL на сервере; React, TypeScript и Vite в вебе | Принято | `server/go.mod`, `web/package.json`, импорты в `web/src/` |
| [0007](0007-server-architecture.md) | Сервер — слои DDD, домен не зависит от остальных слоёв | Принято | `server/internal/`, `server/test/mocks/` |
| [0008](0008-web-architecture.md) | Веб — слои по образцу clean architecture, один адаптивный компонент на экран | Принято | `web/src/` |
| [0009](0009-checks-and-ci.md) | Проверки — в `scripts/dev.sh`, CI запускает их на каждый PR; `main` меняется только через PR | Принято | `scripts/`, `.github/workflows/`, `server/.golangci.yml`, CLAUDE.md «Сборка и проверка» |
| [0010](0010-local-development.md) | Разработка и приёмка — на локальной машине, без dev-стенда | Принято | `.github/workflows/`, `scripts/dev.sh`, `stand/`, настройки окружения сервера и веба |
| [0011](0011-invite-only-signup.md) | Новые пользователи приходят по приглашению | Предложено | `server/internal/application/service/`, `server/internal/domain/entity/`, `server/internal/presentation/http/v1/`, `server/migrations/`, `web/src/presentation/features/auth/`, `web/src/presentation/features/projects/`, доступ и участники в контракте API |
| [0012](0012-optional-mail.md) | Почта подключается по желанию | Предложено | `server/config/config.go`, `server/cmd/`, `server/internal/app/`, `server/internal/infrastructure/service/notification/`, `server/internal/presentation/http/v1/`, `web/src/presentation/features/auth/`, `web/src/presentation/features/projects/`, приглашения и настройки в контракте API |
| [0013](0013-files-on-server-disk.md) | Файлы хранятся на диске сервера и отдаются через API | Предложено | таблица `files` в `server/migrations/`, загрузка и выдача файлов в `server/internal/`, `server/config/config.go`, `stand/compose.yaml`, `stand/nginx.conf.template`, загрузка аватарки в `web/src/` |
