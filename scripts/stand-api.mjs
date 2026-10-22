// Клиент API локального стенда для scripts/stand-setup.mjs и scripts/stand-smoke.mjs: ходит
// в API через /api веба, как браузер, и хранит cookie сессии.
export const WEB = "http://localhost:3000";
export const MAIL = "http://localhost:3025";

// Первый аккаунт стенда — администратор сервиса (ADR-0016). Его создаёт scripts/dev.sh up,
// им входит заказчик, и от его имени smoke зовёт в проект.
export const ADMIN = { email: "admin@tasktrail.local", password: "tasktrail", username: "Администратор" };

// Сессия одного браузера. Cookie хранятся по имени и пути, как в браузере: сервер ставит `rt`
// на /api/v1/auth/ и тем же ответом удаляет одноимённую cookie старого API на другом пути.
export function createSession() {
  const jar = new Map(); // "имя путь" -> { name, value, path }

  function remember(response) {
    for (const raw of response.headers.getSetCookie()) {
      const [pair, ...attrs] = raw.split(";").map((part) => part.trim());
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      const attr = (key) => attrs.find((item) => item.toLowerCase().startsWith(`${key}=`))?.slice(key.length + 1);
      const path = attr("path") ?? "/";
      const maxAge = attr("max-age");
      const key = `${name} ${path}`;
      if (!value || (maxAge !== undefined && Number(maxAge) <= 0)) jar.delete(key);
      else jar.set(key, { name, value, path });
    }
  }

  // Путь запроса подходит cookie, если совпадает с её путём или лежит под ним (RFC 6265, 5.1.4)
  function cookieHeader(url) {
    return [...jar.values()]
      .filter(({ path }) => url === path || url.startsWith(path.endsWith("/") ? path : `${path}/`))
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");
  }

  // json — тело в JSON; body — готовое тело, например FormData. Ответ — статус и разобранный JSON.
  async function request(method, path, { json, body } = {}) {
    const url = path.startsWith("/api/") ? path : `/api${path}`;
    const headers = { cookie: cookieHeader(url) };
    if (json !== undefined) headers["content-type"] = "application/json";
    const response = await fetch(WEB + url, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : body,
    });
    remember(response);
    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Не JSON: пустое тело 204 или страница Swagger
    }
    return { url, status: response.status, ok: response.ok, data, text, headers: response.headers };
  }

  return {
    request,
    cookie: (name) => [...jar.values()].find((item) => item.name === name),
  };
}

// Ждёт, пока nginx веба начнёт отвечать: compose up --wait не ждёт сервис без healthcheck.
export async function waitForWeb() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await fetch(WEB);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`${WEB} не отвечает`);
}
