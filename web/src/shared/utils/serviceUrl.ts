/**
 * The web address with path as opened in the browser — `serviceUrl` of the first account: the server
 * builds links in emails from it (ADR-0015). The app path is `VITE_ROOT_PATH` (web/README.md).
 */
export const currentServiceUrl = (): string =>
  new URL(import.meta.env.BASE_URL, window.location.origin).href.replace(/\/$/, "");
