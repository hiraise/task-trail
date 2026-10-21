# TaskTrail — сервер

API на Go: Gin, pgx, PostgreSQL. Сейчас реализован модуль доступа — регистрация с подтверждением
почты, вход, обновление токенов, выход, сброс и смена пароля (`/v1/access/*`). Проекты, задачи
и остальное — по плану в [корневом README](../README.md).

Стек — [ADR-0006](../docs/adr/0006-tech-stack.md), устройство кода —
[ADR-0007](../docs/adr/0007-server-architecture.md), процесс разработки — [CLAUDE.md](../CLAUDE.md).

## Запуск и проверки

Нужен Go (версия — в `go.mod`) и PostgreSQL. Сервер читает переменные окружения и файл `.env`
из ближайшей родительской папки, при каждом запуске применяет миграции — они встроены
в бинарник (`migrations/migrations.go`).

```bash
go run ./cmd/app    # запуск
make mock           # пересоздать моки в test/mocks после изменения интерфейсов
```

Проверки сервера — `scripts/dev.sh server` из корня репозитория. Для интеграционных тестов
репозиториев он поднимает временный PostgreSQL в Docker и передаёт адрес в `TEST_PG_URL`;
без него `go test` такие тесты пропускает (`test/testdb`).

## Переменные окружения

В окружении — только то, без чего сервер не запустится ([ADR-0015](../docs/adr/0015-settings-in-admin-ui.md));
остальное — настройки администратора в интерфейсе или константы в `internal/app/app.go`.

| Переменная | Обязательна | Пример или значение по умолчанию | Что задаёт |
| --- | --- | --- | --- |
| `PG_CONNECTION_STRING` | да | `postgresql://user:password@localhost:5432/tasktrail` | подключение к PostgreSQL; `@`, `+`, `%` и другие спецсимволы в пароле — в процент-кодировке, например `@` → `%40` |
| `APP_SECRET` | да | `openssl rand -hex 32` | не короче 32 символов; из него выводятся ключи подписи токенов и шифрования секретов настроек. Смена завершает все сессии, секреты интеграций придётся ввести заново |
| `PORT` | нет | `8080` | порт HTTP |
| `APP_ROOT_PATH` | нет | пусто или `/api` | префикс путей API за прокси: от него считаются пути cookie и Swagger |
| `APP_DEBUG` | нет | `false` | подробные логи |

Временно, пока почта и Swagger не перешли в настройки администратора (шаг 3 этапа 1,
[ADR-0014](../docs/adr/0014-service-administrator.md), [ADR-0017](../docs/adr/0017-mail-in-admin-ui.md)):

| Переменная | Обязательна | Пример или значение по умолчанию | Что задаёт |
| --- | --- | --- | --- |
| `SMTP_HOST`, `SMTP_PORT` | да | `localhost`, `1025` | SMTP-сервер для писем |
| `SMTP_USER`, `SMTP_PASSWORD` | да | `noreply@example.com`, пусто | вход на SMTP |
| `SMTP_SENDER` | нет | `TaskTrail <noreply@example.com>` | отправитель; по умолчанию `SMTP_USER` |
| `FRONTEND_VERIFY_URL` | да | `http://localhost:3000/auth/confirm?token=` | ссылка подтверждения почты, токен дописывается в конец |
| `FRONTEND_RESET_PASSWORD_URL` | да | `http://localhost:3000/auth/reset?token=` | ссылка сброса пароля, токен дописывается в конец |
| `SWAGGER_ENABLED` | нет | `true` | Swagger по адресу `/docs/` |
| `SWAGGER_LOGIN`, `SWAGGER_PASSWORD` | нет | `root`, `root` | Basic-авторизация Swagger |
