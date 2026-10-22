// Дымовая проверка поднятого стенда (ADR-0010): ходит в API через /api, как браузер.
// Администратор стенда входит, обновляет сессию и открывает Swagger; создаёт проект с приглашением,
// приглашённый принимает его по ссылке из письма в Mailpit (без почты — из ответа API), получает
// задачу и меняет её статус, загружает аватарку предельного размера через прокси. В конце проект
// удаляется; приглашённый остаётся пользователем стенда. Запуск: scripts/dev.sh smoke
// (нужен --experimental-strip-types для схемы веба).
import { createUser } from "../web/src/domain/models/User.ts";
import { ADMIN, MAIL, WEB, createSession } from "./stand-api.mjs";

const invitee = {
  email: `smoke-${Date.now()}@tasktrail.local`,
  username: "Дымовой участник",
  password: "smoke-password",
};
// Аватарка ровно предельного размера, 5 МБ (entity.MaxAvatarSize): проходит, только если
// client_max_body_size прокси не меньше предела сервера (ADR-0013). Тип сервер определяет
// по содержимому — по сигнатуре PNG.
const AVATAR_SIZE = 5 << 20;
let failures = 0;

function check(ok, message) {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${message}`);
  return ok;
}

// Запрос, который должен ответить статусом status: провал печатается с телом ответа
async function call(session, method, path, status, options) {
  const response = await session.request(method, path, options);
  const ok = response.status === status;
  check(ok, `${method} ${response.url} → ${response.status}${ok ? "" : ` (ждали ${status}) ${response.text.slice(0, 160)}`}`);
  return response.data;
}

// Без этого шага дальше проверять нечего: провал обрывает проверку
function must(ok, message) {
  if (!check(ok, message)) throw new Error(`дальше без «${message}» не проверить`);
}

// Текст последнего письма на адрес: письма сервера — только текстом (application/letter)
async function mailTo(address) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const found = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`)).json();
    if (found.messages?.length) {
      return (await (await fetch(`${MAIL}/api/v1/message/${found.messages[0].ID}`)).json()).Text ?? "";
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return "";
}

// Сессия администратора и проект проверки: проект удаляется и после провала, иначе
// он остаётся в списке проектов администратора стенда
const admin = createSession();
let projectId;

try {
  const page = await fetch(`${WEB}/projects`);
  check(page.ok && (await page.text()).includes('id="root"'), "веб отдаёт SPA на любом пути");

  const guest = createSession();
  const settings = await call(guest, "GET", "/v1/settings/public", 200);
  check(settings?.registrationOpen === false, "первый аккаунт создан, регистрация закрыта (scripts/dev.sh up)");
  const mailEnabled = settings?.mailEnabled === true;
  console.log(`     почта ${mailEnabled ? "подключена — ссылка приглашения из письма" : "отключена — ссылка приглашения из ответа API"}`);
  check((await guest.request("GET", "/api/docs/")).status === 401, "Swagger без входа закрыт");

  const login = await admin.request("POST", "/v1/auth/login", { json: { email: ADMIN.email, password: ADMIN.password } });
  if (!check(login.status === 200, `вход администратора стенда ${ADMIN.email} → ${login.status}`)) {
    throw new Error("пароль администратора стенда изменён или база создана не scripts/dev.sh up: scripts/dev.sh reset и up");
  }
  check(admin.cookie("at")?.path === "/api/", "cookie access-токена — на путь /api/");
  check(admin.cookie("rt")?.path === "/api/v1/auth/", "cookie refresh-токена — на путь /api/v1/auth/");

  // Как checkAuthStatusUseCase в вебе: сессия есть, только если /auth/check ответил
  // и текущий пользователь разобрался схемой User — иначе веб вернёт на страницу входа
  await call(admin, "GET", "/v1/auth/check", 204);
  const me = await call(admin, "GET", "/v1/users/me", 200);
  check(me?.isAdmin === true, "первый аккаунт — администратор сервиса");
  try {
    createUser(me);
    check(true, "веб принимает текущего пользователя (схема User из web/src)");
  } catch (error) {
    const issues = error.issues?.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    check(false, `веб не примет текущего пользователя и вернёт на вход: ${issues ?? error.message}`);
  }
  await call(admin, "POST", "/v1/auth/refresh", 204);
  await call(admin, "GET", "/v1/auth/check", 204);
  const docs = await admin.request("GET", "/api/docs/");
  check(docs.status === 200 && docs.text.includes("swagger"), `Swagger открывается администратору → ${docs.status}`);

  const statuses = await call(admin, "GET", "/v1/task-statuses", 200);
  check(statuses?.map?.((status) => status.id).join() === "open,in_progress,in_review,done", "статусы задач — фиксированный набор");

  const created = await call(admin, "POST", "/v1/projects", 201, {
    json: { name: "Дымовой проект", description: "scripts/dev.sh smoke", emails: [invitee.email] },
  });
  projectId = created?.project?.id;
  const invitation = created?.invitations?.[0];
  must(Boolean(projectId) && invitation?.result === "invited", `проект создан, почта приглашена → ${invitation?.result}`);

  const link = mailEnabled ? (await mailTo(invitee.email)).match(/https?:\/\/\S+\/auth\/invite\?token=\S+/)?.[0] : invitation.inviteUrl;
  must(Boolean(link?.startsWith(`${WEB}/auth/invite?token=`)), `ссылка приглашения ведёт на веб стенда: ${link ?? "нет ссылки"}`);
  const token = new URL(link).searchParams.get("token");

  const member = createSession();
  const info = await call(member, "POST", "/v1/auth/invitations/lookup", 200, { json: { token } });
  check(info?.projectName === "Дымовой проект", "приглашение ведёт в созданный проект");
  const joined = await call(member, "POST", "/v1/auth/invitations/accept", 201, {
    json: { token, username: invitee.username, password: invitee.password },
  });
  must(Boolean(joined?.id), "приглашённый создал аккаунт по ссылке");
  const project = await call(member, "GET", `/v1/projects/${projectId}`, 200);
  check(project?.role === "member", `приглашённый — участник проекта → ${project?.role}`);

  const task = await call(admin, "POST", "/v1/tasks", 201, {
    json: { projectId, name: "Дымовая задача", description: null, assigneeId: joined?.id },
  });
  const myTasks = await call(member, "GET", "/v1/users/me/tasks", 200);
  check(myTasks?.some?.((item) => item.id === task?.id), "задача есть у исполнителя в «Мои задачи»");
  const moved = await call(member, "PATCH", `/v1/tasks/${task?.id}/status`, 200, { json: { statusId: "in_progress" } });
  check(moved?.statusId === "in_progress", "исполнитель взял задачу в работу");
  const projectTasks = await call(admin, "GET", `/v1/projects/${projectId}/tasks`, 200);
  check(projectTasks?.find?.((item) => item.id === task?.id)?.statusId === "in_progress", "новый статус виден в задачах проекта");

  const avatar = new Uint8Array(AVATAR_SIZE);
  avatar.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const form = new FormData();
  form.append("file", new Blob([avatar], { type: "image/png" }), "avatar.png");
  const withAvatar = await call(member, "PATCH", "/v1/users/me/avatar", 200, { body: form });
  const file = await fetch(`${WEB}/api/v1/files/${withAvatar?.avatarId}`);
  const size = (await file.arrayBuffer()).byteLength;
  check(file.ok && size === AVATAR_SIZE, `аватарка 5 МБ отдаётся по ссылке → ${file.status}, ${size} байт`);

  await call(member, "POST", "/v1/auth/logout", 204);
} catch (error) {
  // fetch без ответа сервера бросает TypeError «fetch failed» с причиной в cause
  const down = error instanceof TypeError && error.cause;
  check(false, down ? `стенд не отвечает: ${error.cause.code ?? error.cause.message} — подними его: scripts/dev.sh up` : `проверка оборвалась: ${error.message}`);
}
if (admin.cookie("rt")) {
  try {
    if (projectId) await call(admin, "DELETE", `/v1/projects/${projectId}`, 204);
    await call(admin, "POST", "/v1/auth/logout", 204);
  } catch (error) {
    check(false, `проект проверки не удалён: ${error.message}`);
  }
}

if (failures > 0) {
  console.error(`== smoke: провалов ${failures}`);
  process.exit(1);
}
console.log("== smoke: стенд работает");
