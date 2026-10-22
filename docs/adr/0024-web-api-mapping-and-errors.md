# ADR-0024: Веб переводит ответы API в модели без схем, а ошибки различает по коду `ApiError`

- **Статус:** Принято
- **Дата:** 2026-10-22
- **Затрагивает:** `web/src/infrastructure/http/`, `web/src/infrastructure/repositories/`, `web/src/domain/models/`, `web/src/shared/errors/`, `web/src/shared/locales/apiErrors.ts`

## Контекст

Типы ответов веб берёт из контракта ([ADR-0020](0020-web-api-types.md)), а форму ответов сервера
проверяют его тесты по контракту ([ADR-0019](0019-server-contract-tests.md)). Zod-схемы ответов
в `domain/models` повторяли контракт руками и разошлись с ним: `avatarUrl: null` ронял вход.
Ошибки репозитории подменяли своим текстом, и код из `ApiError` ([ADR-0018](0018-api-conventions.md))
до экрана не доходил.

## Решение

- Ответ API репозиторий получает в сгенерированном типе и переводит в модель `domain` обычной
  функцией (`infrastructure/repositories/mappers.ts`). Схемами ответы не проверяй: zod — только
  для форм.
- ID в моделях — строки из API, без приведения к числу и обратно.
- Ссылку на файл (аватарку) собирает репозиторий из ID файла: `fileUrl` в
  `infrastructure/config/apiRoutes.ts`; модель хранит готовый адрес.
- `HttpClient` бросает `AppError` с `code` и `details` из `ApiError` (`infrastructure/http/apiError.ts`).
  Репозитории ошибки не перехватывают и своим текстом не подменяют.
- Список кодов веба — `ApiErrorCode` в `shared/errors/types.ts`; совпадение с `ErrorCode`
  контракта проверяет сборка.
- Пользователю показывай текст по коду из `shared/locales/apiErrors.ts` (`errorMessage`,
  `toastError` в `shared/errors/errorMessage.ts`); `message` из ответа не показывай.
- Ошибки сессии, сети, тайм-аута и неизвестные показывает `handleGlobalError`, остальные — экран,
  который сделал запрос; `toastError` общие ошибки повторно не показывает.
- Запросам, которые шлют письма в самом запросе ([ADR-0017](0017-mail-in-admin-ui.md)), ставь
  тайм-аут `MAIL_REQUEST_TIMEOUT_MS`, остальным хватает `REQUEST_TIMEOUT_MS`
  (`infrastructure/http/timeouts.ts`).

## Последствия

- Zod-схемы ответов проектов, участников, задач и статусов уходят вместе с переводом их
  репозиториев на контракт (шаги 6.2 и 6.3, [план](../roadmap.md)).

## Проверка

`npm run build` в `web/` падает, если `ApiErrorCode` и `ErrorCode` контракта разошлись; перевод
ответов и ошибок покрывают тесты `mappers.test.ts` и `apiError.test.ts`.

## Альтернативы

- Проверять ответы схемами в вебе — это вторая копия контракта, которую приходится держать руками.
