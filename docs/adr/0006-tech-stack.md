# ADR-0006: Стек: Go, Gin и PostgreSQL на сервере; React, TypeScript и Vite в вебе

- **Статус:** Предложено
- **Дата:** 2026-10-21
- **Затрагивает:** `server/go.mod`, `web/package.json`, импорты в `web/src/`

## Контекст

Стек сложился в двух репозиториях; фиксируем его, чтобы новые библиотеки не появлялись
мимо решений.

## Решение

- Сервер: Go (версия — в `server/go.mod`), Gin, pgx, golang-migrate, PostgreSQL.
- Веб: React, TypeScript, Vite, TanStack Router, TanStack Query, Zustand,
  React Hook Form и Zod, CSS Modules.
- Веб — SPA за авторизацией: серверный рендеринг не нужен, Next.js не используем
  (переход на Vite — PR hiraise/tt-frontend#11).
- Зависимости, объявленные в `server/go.mod` и `web/package.json` на дату этого ADR, приняты
  вместе с ним; выше — только основа стека.
- Новую библиотеку подключай только вместе с ADR. Обновление версий без смены поведения
  ADR не требует.
- Каждый пакет, импортируемый в `web/src`, объявлен в `web/package.json`: транзитивные
  зависимости не импортируем.

## Проверка

`scripts/rules.mjs` — все импорты `web/src` объявлены в `web/package.json`.
