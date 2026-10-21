# TaskTrail Backend API

![MIT License](https://img.shields.io/github/license/hiraise/tt-backend)
[![codecov](https://codecov.io/gh/hiraise/tt-backend/graph/badge.svg?token=WD2LRZ5R1I)](https://codecov.io/gh/hiraise/tt-backend)

Backend of the [TaskTrail](https://github.com/hiraise/task-trail) project, built with Go.

## 🚀 Features

_Coming soon_

## 🧱 Technologies

- [Gin](https://github.com/gin-gonic/gin) — High-performance HTTP web framework
- [pgx](https://github.com/jackc/pgx) — PostgreSQL driver and toolkit
- [Docker](https://www.docker.com/) — Containerized environment
- [golangci-lint](https://github.com/golangci/golangci-lint) — Linting

## 🛠 Installation

_Coming soon_

## 🛠 Environment

| Environment Variable                | Example Value          | Description |
| ------------------------------------ | --------------------- | ----------- |
| **APP SETTINGS**                     |                       |             |
| `APP_DEBUG`                          | `true`                | Enable debug mode |
| `APP_ROOT_PATH`                      | `8080`                | Port on which the app will run. Can be empty; defaults to 8080 |
| **DATABASE SETTINGS**                |                       |             |
| `PG_MIGRATION_ENABLED`               | `true`                | When enabled, automatically applies all migrations to DB. Can be empty; defaults to false |
| `PG_MIGRATION_PATH`                  | `"file://migrations"` | Migration folder path. Can be empty; required id PG_MIGRATION_ENABLED is true |
| `PG_CONNECTION_STRING`               | `postgresql://login:password@address:5432/db_name` | PostgreSQL connection string |
| `PG_MAX_POOL_SIZE`                   | `10`                  | Maximum number of simultaneous PostgreSQL connections |
| **AUTHENTICATION SETTINGS**          |                       |             |
| `AUTH_ACCESS_TOKEN_SECRET`           | `s3cr3tK3y!@#2025$%^&*()_+aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890` | Secret for creating access tokens |
| `AUTH_ACCESS_TOKEN_LIFETIME_MIN`     | `5`                   | Access token lifetime in minutes |
| `AUTH_REFRESH_TOKEN_SECRET`          | `s3cr3tK3y!@#2025$%^&*()_+aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890` | Secret for creating refresh tokens (should differ from access token secret) |
| `AUTH_REFRESH_TOKEN_LIFETIME_MIN`    | `1440`                | Refresh token lifetime in minutes |
| `AUTH_TOKEN_ISSUER`                  | `example.com`         | [Issuer claim](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.1) |
| **SMTP SETTINGS**                    |                       |             |
| `SMTP_HOST`                          | `mail.example.com`    | SMTP server host |
| `SMTP_PORT`                          | `587`                 | SMTP server port |
| `SMTP_USER`                          | `noreply@example.com` | SMTP server authentication email |
| `SMTP_PASSWORD`                      | `password123`         | SMTP server authentication password |
| `SMTP_SENDER`                        | `TaskTrail <noreply@example.com>` | Sender email and name. Can be empty; defaults to `SMTP_USER` |
| **REDIRECT SETTINGS**                |                       |             |
| `FRONTEND_URL`                       | `https://tasktrail.com`    | Base URL for the frontend application, used for redirection purposes |
| `FRONTEND_VERIFY_URL`                | `https://tasktrail.com/auth/verify?token=` | URL template for user account verification, with the `token` parameter appended dynamically |
| `FRONTEND_RESET_PASSWORD_URL`        | `https://tasktrail.com/auth/reset?token=` | URL template for password reset functionality, with the `token` parameter appended dynamically |
