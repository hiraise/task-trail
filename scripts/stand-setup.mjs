// Настройка поднятого стенда (ADR-0015): то, что на своём сервере администратор делает
// в интерфейсе, здесь делает API администратора. Запуск — из scripts/dev.sh up.
//
// На пустой базе создаёт первый аккаунт — администратора сервиса с адресом веба стенда — и
// подключает почту к Mailpit (ADR-0016, ADR-0017). Дальше настройки не трогает: что
// администратор поменял на стенде, то и остаётся до scripts/dev.sh reset.
import { ADMIN, MAIL, WEB, createSession, waitForWeb } from "./stand-api.mjs";

// Mailpit из stand/compose.yaml принимает письма без шифрования и без входа
const MAILPIT = { host: "mailpit", port: 1025, encryption: "none", sender: "TaskTrail <noreply@tasktrail.local>", username: null };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message, response) {
  console.error(`== стенд: ${message}${response ? `: ${response.status} ${response.text.slice(0, 200)}` : ""}`);
  process.exit(1);
}

await waitForWeb();
const session = createSession();
const settings = await session.request("GET", "/v1/settings/public");
if (!settings.ok) fail("сервер не отдал настройки", settings);

if (settings.data.registrationOpen) {
  const registered = await session.request("POST", "/v1/auth/register", { json: { ...ADMIN, serviceUrl: WEB } });
  if (registered.status !== 201) fail("первый аккаунт не создан", registered);
  // Сервер проверяет подключение к SMTP перед сохранением, а Mailpit мог ещё не открыть порт
  let saved;
  for (let attempt = 0; attempt < 10; attempt++) {
    saved = await session.request("PUT", "/v1/admin/settings/mail", { json: MAILPIT });
    if (saved.status !== 502) break;
    await sleep(1000);
  }
  if (!saved.ok) fail("почта не подключена к Mailpit", saved);
  await session.request("POST", "/v1/auth/logout");
  console.log("== стенд: создан первый аккаунт — администратор сервиса, почта подключена к Mailpit");
} else if (!settings.data.mailEnabled) {
  console.log(
    "== стенд: почта отключена в настройках администратора — писем нет, ссылки приглашений приходят в ответах API. " +
      "Подключить Mailpit заново: scripts/dev.sh reset и up",
  );
}

console.log(`== стенд запущен
  веб      ${WEB}   Chrome или Firefox: Safari не принимает Secure-cookies по http
  вход     ${ADMIN.email}, пароль ${ADMIN.password} — администратор сервиса
  почта    ${MAIL}   Mailpit: письма приглашений и сброса пароля
  Swagger  ${WEB}/api/docs/   в том же браузере после входа администратором
Остановить — scripts/dev.sh down, стереть базу и файлы — scripts/dev.sh reset.`);
