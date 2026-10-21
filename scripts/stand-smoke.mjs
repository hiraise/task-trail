// Дымовая проверка поднятого стенда (ADR-0010): ходит в API через /api, как браузер.
// Регистрация с письмом из Mailpit, вход, обновление токена, проект. Запуск: scripts/dev.sh smoke.
const WEB = "http://localhost:3000";
const MAIL = "http://localhost:8025";
const email = `smoke-${Date.now()}@tasktrail.local`;
const password = "smoke-password";
const cookies = new Map(); // имя -> { value, path }
let failures = 0;

function check(ok, message) {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${message}`);
  return ok;
}

function rememberCookies(response) {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";").map((part) => part.trim());
    const [name, ...value] = pair.split("=");
    const path = attrs.find((attr) => attr.toLowerCase().startsWith("path="))?.slice(5) ?? "/";
    cookies.set(name, { value: value.join("="), path });
  }
}

async function api(method, path, body) {
  const url = `/api${path}`;
  const cookie = [...cookies]
    .filter(([, c]) => c.value && url.startsWith(c.path))
    .map(([name, c]) => `${name}=${c.value}`)
    .join("; ");
  const response = await fetch(WEB + url, {
    method,
    headers: { "content-type": "application/json", cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  rememberCookies(response);
  const text = await response.text();
  check(response.ok, `${method} ${url} → ${response.status}${response.ok ? "" : ` ${text.slice(0, 120)}`}`);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function mailTo(address) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const found = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`)).json();
    if (found.messages?.length) {
      return (await (await fetch(`${MAIL}/api/v1/message/${found.messages[0].ID}`)).json()).HTML ?? "";
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return "";
}

try {
  const page = await fetch(`${WEB}/projects`);
  check(page.ok && (await page.text()).includes('id="root"'), "веб отдаёт SPA на любом пути");

  await api("POST", "/v1/auth/register", { email, password });
  const token = (await mailTo(email)).match(/token=([0-9a-f-]{36})/)?.[1];
  if (check(Boolean(token), "письмо подтверждения пришло в Mailpit")) {
    await api("POST", "/v1/auth/verify", { token });
  }
  await api("POST", "/v1/auth/login", { email, password });
  check(cookies.get("rt")?.path === "/api/v1/auth/refresh", "cookie обновления токена — на путь /api/v1/auth/refresh");
  await api("GET", "/v1/auth/check");
  await api("POST", "/v1/auth/refresh");

  const project = await api("POST", "/v1/projects", { name: "Дымовой проект", description: "scripts/dev.sh smoke" });
  const projects = await api("GET", "/v1/projects");
  check(projects?.some?.((item) => item.id === project?.id), "созданный проект есть в списке");
  await api("POST", "/v1/auth/logout");
} catch (error) {
  check(false, `стенд не отвечает: ${error.message} — подними его: scripts/dev.sh up`);
}

if (failures > 0) {
  console.error(`== smoke: провалов ${failures}`);
  process.exit(1);
}
console.log("== smoke: стенд работает");
