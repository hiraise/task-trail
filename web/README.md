# TaskTrail — веб-клиент

SPA на React и TypeScript: вход и регистрация, проекты и участники, задачи, профиль.
Доски, комментарии и поиск пока только свёрстаны и показывают заглушки — сервер их ещё
не отдаёт (план — в [корневом README](../README.md)).

|                      Десктоп                      |                     Телефон                     |
| :-----------------------------------------------: | :---------------------------------------------: |
| ![Вход на десктопе](./docs/images/login-desktop.png) | ![Вход на телефоне](./docs/images/login-mobile.png) |

Стек — [ADR-0006](../docs/adr/0006-tech-stack.md), правила устройства кода —
[ADR-0008](../docs/adr/0008-web-architecture.md), процесс разработки — [CLAUDE.md](../CLAUDE.md).

## Запуск

Нужны Node.js и npm версий из `engines` в `package.json`; другие npm отвергает сам (`.npmrc`).
Команды — из папки `web/`:

```bash
npm ci            # зависимости по package-lock.json
npm run dev       # dev-сервер на http://localhost:5173 (3000 занят локальным стендом)
npm run lint      # ESLint
npm run test:run  # тесты Vitest
npm run build     # проверка типов и сборка в dist/
npm run api:types # типы API из ../api/openapi.yaml — после каждого изменения контракта
npm run preview   # просмотр собранной версии
```

Все проверки репозитория разом — `scripts/dev.sh check` из корня.

## Окружение

Переменные читаются при сборке:

| Переменная | По умолчанию | Что задаёт |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080` | адрес API сервера |
| `VITE_ROOT_PATH` | пусто | путь, под которым открывается приложение, например `/tasktrail` |

## Структура `src/`

```text
src/
├── routes/              # маршруты TanStack Router: _main/ — после входа, auth/ — вход и регистрация
├── application/         # сценарии, DTO и payload-ы запросов
├── domain/              # модели, интерфейсы репозиториев, типы
├── infrastructure/      # HTTP-клиент, адреса API, репозитории API; api/generated — типы из контракта
├── presentation/
│   ├── app/             # провайдеры и компоненты уровня приложения
│   ├── features/        # экраны и компоненты по разделам: auth, boards, projects, tasks, user
│   └── shared/          # общие компоненты, UI-кит, модальные окна, хуки
├── shared/              # конфиг, константы, ошибки, тексты интерфейса, утилиты
└── styles/              # глобальные стили и переменные дизайна
```

## Лицензия

[MIT](../LICENSE).
