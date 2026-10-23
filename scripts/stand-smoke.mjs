// Smoke test of the running local stack (ADR-0010): calls the API through /api, like a browser.
// The stack administrator signs in, refreshes the session and opens Swagger; creates a project with
// a random key and an invitation; the invitee accepts it via the link from the email in Mailpit (without
// mail, from the API response), gets a task with the key <project key>-1, changes its status, writes,
// edits and deletes a comment and reads the history (ADR-0028), archives and restores it (ADR-0027), finds
// it by key and by part of its name (ADR-0030), uploads
// an avatar of the maximum size through the proxy. At the end the project is deleted; the invitee stays
// a user of the stack. Run: scripts/dev.sh smoke.
import { ADMIN, MAIL, WEB, createSession, randomProjectKey } from "./stand-api.mjs";

const invitee = {
  email: `smoke-${Date.now()}@tasktrail.local`,
  username: "Дымовой участник",
  password: "smoke-password",
};
// An avatar of exactly the maximum size, 5 MB (entity.MaxAvatarSize): passes only if
// the proxy's client_max_body_size is not below the server limit (ADR-0013). The server detects the type
// by content, from the PNG signature.
const AVATAR_SIZE = 5 << 20;
let failures = 0;

function check(ok, message) {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"} ${message}`);
  return ok;
}

// A request that must respond with the given status: a failure is printed with the response body
async function call(session, method, path, status, options) {
  const response = await session.request(method, path, options);
  const ok = response.status === status;
  check(ok, `${method} ${response.url} → ${response.status}${ok ? "" : ` (expected ${status}) ${response.text.slice(0, 160)}`}`);
  return response.data;
}

// Without this step there is nothing more to check: a failure aborts the run
function must(ok, message) {
  if (!check(ok, message)) throw new Error(`cannot continue without "${message}"`);
}

// Text of the latest email to the address: the server sends plain-text emails only (application/letter)
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

// The administrator session and the test project: the project is deleted even after a failure, otherwise
// it stays in the stack administrator's project list
const admin = createSession();
let projectId;

try {
  const page = await fetch(`${WEB}/projects`);
  check(page.ok && (await page.text()).includes('id="root"'), "web serves the SPA on any path");

  const guest = createSession();
  const settings = await call(guest, "GET", "/v1/settings/public", 200);
  check(settings?.registrationOpen === false, "first account created, registration closed (scripts/dev.sh up)");
  const mailEnabled = settings?.mailEnabled === true;
  console.log(`     mail ${mailEnabled ? "enabled: invitation link from the email" : "disabled: invitation link from the API response"}`);
  check((await guest.request("GET", "/api/docs/")).status === 401, "Swagger is closed without sign-in");

  const login = await admin.request("POST", "/v1/auth/login", { json: { email: ADMIN.email, password: ADMIN.password } });
  if (!check(login.status === 200, `stack administrator sign-in ${ADMIN.email} → ${login.status}`)) {
    throw new Error("the stack administrator password was changed or the database was not created by scripts/dev.sh up: run scripts/dev.sh reset and up");
  }
  check(admin.cookie("at")?.path === "/api/", "access token cookie is on path /api/");
  check(admin.cookie("rt")?.path === "/api/v1/auth/", "refresh token cookie is on path /api/v1/auth/");

  // Like checkAuthStatusUseCase in the web: there is a session if /v1/users/me returned a user
  await call(admin, "GET", "/v1/auth/check", 204);
  const me = await call(admin, "GET", "/v1/users/me", 200);
  check(me?.isAdmin === true, "the first account is the service administrator");
  await call(admin, "POST", "/v1/auth/refresh", 204);
  await call(admin, "GET", "/v1/auth/check", 204);
  const docs = await admin.request("GET", "/api/docs/");
  check(docs.status === 200 && docs.text.includes("swagger"), `Swagger opens for the administrator → ${docs.status}`);

  const statuses = await call(admin, "GET", "/v1/task-statuses", 200);
  check(statuses?.map?.((status) => status.id).join() === "open,in_progress,in_review,done", "task statuses are the fixed set");

  const projectKey = randomProjectKey();
  const created = await call(admin, "POST", "/v1/projects", 201, {
    json: { name: "Дымовой проект", description: "scripts/dev.sh smoke", key: projectKey, emails: [invitee.email] },
  });
  projectId = created?.project?.id;
  const invitation = created?.invitations?.[0];
  must(Boolean(projectId) && invitation?.result === "invited", `project created, email invited → ${invitation?.result}`);

  const link = mailEnabled ? (await mailTo(invitee.email)).match(/https?:\/\/\S+\/auth\/invite\?token=\S+/)?.[0] : invitation.inviteUrl;
  must(Boolean(link?.startsWith(`${WEB}/auth/invite?token=`)), `invitation link leads to the stack web: ${link ?? "no link"}`);
  const token = new URL(link).searchParams.get("token");

  const member = createSession();
  const info = await call(member, "POST", "/v1/auth/invitations/lookup", 200, { json: { token } });
  check(info?.projectName === "Дымовой проект", "invitation leads to the created project");
  const joined = await call(member, "POST", "/v1/auth/invitations/accept", 201, {
    json: { token, username: invitee.username, password: invitee.password },
  });
  must(Boolean(joined?.id), "invitee created an account via the link");
  const project = await call(member, "GET", `/v1/projects/${projectId}`, 200);
  check(project?.role === "member", `invitee is a project member → ${project?.role}`);

  const task = await call(admin, "POST", "/v1/tasks", 201, {
    json: { projectId, name: "Дымовая задача", description: null, assigneeId: joined?.id },
  });
  check(task?.key === `${projectKey}-1`, `the first task's key is ${projectKey}-1 → ${task?.key}`);
  const myTasks = await call(member, "GET", "/v1/users/me/tasks", 200);
  check(myTasks?.some?.((item) => item.id === task?.id), "the task is in the assignee's \"My tasks\"");
  const moved = await call(member, "PATCH", `/v1/tasks/${task?.id}/status`, 200, { json: { statusId: "in_progress" } });
  check(moved?.statusId === "in_progress", "assignee moved the task to in progress");
  const projectTasks = await call(admin, "GET", `/v1/projects/${projectId}/tasks`, 200);
  check(projectTasks?.find?.((item) => item.id === task?.id)?.statusId === "in_progress", "the new status is visible in the project tasks");

  // Task feed (ADR-0028): a comment is written, edited and deleted; the history has "created" and
  // "status_changed"
  const comments = `/v1/tasks/${task?.id}/comments`;
  const comment = await call(member, "POST", comments, 201, { json: { text: "  Дымовой комментарий  " } });
  check(comment?.text === "Дымовой комментарий" && comment?.author?.email === invitee.email, "the assignee wrote a comment, the text is trimmed");
  const edited = await call(member, "PATCH", `${comments}/${comment?.id}`, 200, { json: { text: "Исправлено" } });
  check(edited?.text === "Исправлено" && edited?.editedAt !== null, "the author edited the comment");
  await call(admin, "DELETE", `${comments}/${comment?.id}`, 204);
  check((await call(member, "GET", comments, 200))?.length === 0, "the project owner deleted the comment");
  const history = await call(member, "GET", `/v1/tasks/${task?.id}/events`, 200);
  check(history?.map?.((event) => event.kind).join() === "status_changed,created", `the task history → ${history?.map?.((event) => event.kind)}`);
  check(history?.[0]?.fromStatusId === "open" && history?.[0]?.toStatusId === "in_progress", "the history shows open → in_progress");

  // Archive (ADR-0027): an archived task leaves the active list and is read-only until restored
  const archived = await call(member, "PATCH", `/v1/tasks/${task?.id}/archived`, 200, { json: { archived: true } });
  check(archived?.archivedAt !== null && archived?.archivedAt !== undefined, "the assignee archived the task");
  const archivedList = await call(admin, "GET", `/v1/projects/${projectId}/tasks?archived=true`, 200);
  check(archivedList?.some?.((item) => item.id === task?.id), "the task is in the project's archived tasks");
  // An archived task does not change: 409
  await call(member, "PATCH", `/v1/tasks/${task?.id}/status`, 409, { json: { statusId: "done" } });
  const restored = await call(member, "PATCH", `/v1/tasks/${task?.id}/archived`, 200, { json: { archived: false } });
  check(restored?.archivedAt === null, "the task is restored from the archive");

  // Search (ADR-0030): the task by its key in lower case comes first; by part of its name
  const byKey = await call(member, "GET", `/v1/search?q=${encodeURIComponent(task?.key?.toLowerCase())}`, 200);
  check(byKey?.tasks?.[0]?.id === task?.id, `search by key ${task?.key} finds the task first`);
  const byName = await call(member, "GET", `/v1/search?q=${encodeURIComponent("дымовая зад")}`, 200);
  check(byName?.tasks?.some?.((item) => item.id === task?.id), "search by part of the name finds the task");

  // Boards (ADR-0029): the member sees the task on the board, leaves it; the owner deletes it
  const board = await call(admin, "POST", "/v1/boards", 201, {
    json: { name: "Дымовая доска", projectIds: [projectId], memberIds: [joined?.id] },
  });
  check(board?.members?.length === 2 && board?.projects?.[0]?.id === projectId, "board created with the project and the member");
  const boardTasks = await call(member, "GET", `/v1/boards/${board?.id}/tasks`, 200);
  check(boardTasks?.some?.((item) => item.id === task?.id), "the member sees the task on the board");
  // A task from a kanban column starts in that column's status
  const fromColumn = await call(member, "POST", "/v1/tasks", 201, {
    json: { projectId, name: "Дымовая задача из колонки", statusId: "in_progress" },
  });
  check(fromColumn?.statusId === "in_progress", "a task is created right in the in_progress status");
  await call(member, "DELETE", `/v1/tasks/${fromColumn?.id}`, 204);
  await call(member, "DELETE", `/v1/boards/${board?.id}/leave`, 204);
  await call(member, "GET", `/v1/boards/${board?.id}`, 404);
  await call(admin, "DELETE", `/v1/boards/${board?.id}`, 204);

  const avatar = new Uint8Array(AVATAR_SIZE);
  avatar.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const form = new FormData();
  form.append("file", new Blob([avatar], { type: "image/png" }), "avatar.png");
  const withAvatar = await call(member, "PATCH", "/v1/users/me/avatar", 200, { body: form });
  const file = await fetch(`${WEB}/api/v1/files/${withAvatar?.avatarId}`);
  const size = (await file.arrayBuffer()).byteLength;
  check(file.ok && size === AVATAR_SIZE, `5 MB avatar is served by its link → ${file.status}, ${size} bytes`);

  await call(member, "POST", "/v1/auth/logout", 204);
} catch (error) {
  // fetch without a server response throws TypeError "fetch failed" with the reason in cause
  const down = error instanceof TypeError && error.cause;
  check(false, down ? `stack is not responding: ${error.cause.code ?? error.cause.message}; start it: scripts/dev.sh up` : `check aborted: ${error.message}`);
}
if (admin.cookie("rt")) {
  try {
    if (projectId) await call(admin, "DELETE", `/v1/projects/${projectId}`, 204);
    await call(admin, "POST", "/v1/auth/logout", 204);
  } catch (error) {
    check(false, `test project not deleted: ${error.message}`);
  }
}

if (failures > 0) {
  console.error(`== smoke: failures: ${failures}`);
  process.exit(1);
}
console.log("== smoke: the stack works");
