/**
 * Адрес веба с путём, как его открыл браузер, — `serviceUrl` первого аккаунта: от него сервер
 * строит ссылки в письмах (ADR-0015). Путь приложения — `VITE_ROOT_PATH` (web/README.md).
 */
export const currentServiceUrl = (): string =>
  new URL(import.meta.env.BASE_URL, window.location.origin).href.replace(/\/$/, "");
