// Local stack API client for scripts/stand-setup.mjs and scripts/stand-smoke.mjs: calls
// the API through the web's /api, like a browser, and keeps the session cookies.
export const WEB = "http://localhost:3000";
export const MAIL = "http://localhost:3025";

// The stack's first account is the service administrator (ADR-0016). scripts/dev.sh up creates it,
// the customer signs in with it, and smoke invites to a project on its behalf.
export const ADMIN = { email: "admin@tasktrail.local", password: "tasktrail", username: "Администратор" };

// A random project key: S and six upper-case base36 characters (ADR-0026). The key is unique among
// non-deleted projects, and the stack keeps projects between runs.
export function randomProjectKey() {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) => (byte % 36).toString(36));
  return `S${digits.join("").toUpperCase()}`;
}

// A single browser session. Cookies are stored by name and path, as in a browser: the server sets `rt`
// on /api/v1/auth/ and in the same response deletes the old API's cookie of the same name on another path.
export function createSession() {
  const jar = new Map(); // "name path" -> { name, value, path }

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

  // A request path matches a cookie if it equals the cookie's path or lies under it (RFC 6265, 5.1.4)
  function cookieHeader(url) {
    return [...jar.values()]
      .filter(({ path }) => url === path || url.startsWith(path.endsWith("/") ? path : `${path}/`))
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");
  }

  // json is a body to send as JSON; body is a ready body, e.g. FormData. Returns the status and parsed JSON.
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
      // Not JSON: an empty 204 body or the Swagger page
    }
    return { url, status: response.status, ok: response.ok, data, text, headers: response.headers };
  }

  return {
    request,
    cookie: (name) => [...jar.values()].find((item) => item.name === name),
  };
}

// Waits until the web's nginx responds: compose up --wait does not wait for a service without a healthcheck.
export async function waitForWeb() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await fetch(WEB);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`${WEB} is not responding`);
}
