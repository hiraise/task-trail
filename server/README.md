# TaskTrail — сервер

API на Go: Gin, pgx, PostgreSQL. Сейчас реализован модуль доступа — регистрация с подтверждением
почты, вход, обновление токенов, выход, сброс и смена пароля (`/v1/access/*`). Проекты, задачи
и остальное — по плану в [корневом README](../README.md).

Стек — [ADR-0006](../docs/adr/0006-tech-stack.md), устройство кода —
[ADR-0007](../docs/adr/0007-server-architecture.md), процесс разработки — [CLAUDE.md](../CLAUDE.md).

## Запуск и проверки

Нужен Go (версия — в `go.mod`) и PostgreSQL. Сервер читает переменные окружения и файл `.env`
из ближайшей родительской папки. Слушает порт 8080 или порт из переменной `PORT`.

```bash
go run ./cmd/app    # запуск
make mock           # пересоздать моки в test/mocks после изменения интерфейсов
```

Проверки сервера — `scripts/dev.sh server` из корня репозитория.

## Переменные окружения

«Да» в колонке «Обязательна» значит, что переменная должна быть задана, иначе сервер не запустится;
значение при этом может быть пустым.

| Переменная | Обязательна | Пример или значение по умолчанию | Что задаёт |
| --- | --- | --- | --- |
| `APP_DEBUG` | да | `true` | подробные логи |
| `APP_ROOT_PATH` | да | пусто или `/tasktrail/api` | префикс путей API: от него считаются путь cookie обновления токена и Swagger |
| `PG_CONNECTION_STRING` | да | `postgresql://user:password@localhost:5432/tasktrail` | подключение к PostgreSQL |
| `PG_MAX_POOL_SIZE` | да | `10` | максимум одновременных подключений к базе |
| `PG_MIGRATION_ENABLED` | нет | `false` | применять миграции при запуске |
| `PG_MIGRATION_PATH` | при включённых миграциях | `file://migrations` | папка миграций |
| `AUTH_ACCESS_TOKEN_SECRET` | да | длинная случайная строка | секрет access-токенов |
| `AUTH_ACCESS_TOKEN_LIFETIME_MIN` | да | `5` | время жизни access-токена, минут |
| `AUTH_ACCESS_TOKEN_NAME` | нет | `at` | имя cookie access-токена |
| `AUTH_REFRESH_TOKEN_SECRET` | да | другая длинная случайная строка | секрет refresh-токенов; должен отличаться от секрета access-токенов |
| `AUTH_REFRESH_TOKEN_LIFETIME_MIN` | да | `1440` | время жизни refresh-токена, минут |
| `AUTH_REFRESH_TOKEN_NAME` | нет | `rt` | имя cookie refresh-токена |
| `AUTH_TOKEN_ISSUER` | да | `tasktrail.local` | поле [iss](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.1) в токенах |
| `AUTH_CONFIRMATION_TOKEN_LIFETIME_MIN` | да | `60` | время жизни ссылок из писем: подтверждение почты, сброс пароля |
| `SMTP_HOST` | да | `localhost` | SMTP-сервер для писем |
| `SMTP_PORT` | да | `1025` | порт SMTP |
| `SMTP_USER` | да | `noreply@example.com` | логин SMTP |
| `SMTP_PASSWORD` | да | | пароль SMTP |
| `SMTP_SENDER` | нет | `TaskTrail <noreply@example.com>` | отправитель; по умолчанию `SMTP_USER` |
| `FRONTEND_URL` | да | `http://localhost:3000` | адрес веб-клиента |
| `FRONTEND_VERIFY_URL` | да | `http://localhost:3000/auth/confirm?token=` | ссылка подтверждения почты, токен дописывается в конец |
| `FRONTEND_RESET_PASSWORD_URL` | да | `http://localhost:3000/auth/reset?token=` | ссылка сброса пароля, токен дописывается в конец |
| `FRONTEND_PROJECT_URL` | да | `http://localhost:3000/projects/` | ссылка на проект в письмах |
| `SWAGGER_ENABLED` | нет | `true` | Swagger по адресу `/docs/` |
| `SWAGGER_LOGIN`, `SWAGGER_PASSWORD` | нет | `root`, `root` | Basic-авторизация Swagger; поменяйте, если сервер доступен не только вам |
