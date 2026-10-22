// Setup of the running local stack (ADR-0015): what an administrator does in the UI on their own
// server is done here via the admin API. Run from scripts/dev.sh up.
//
// On an empty database, creates the first account (the service administrator, with the stack's web
// address) and connects mail to Mailpit (ADR-0016, ADR-0017). After that it leaves settings alone: what
// the administrator changed on the stack stays until scripts/dev.sh reset.
import { ADMIN, MAIL, WEB, createSession, waitForWeb } from "./stand-api.mjs";

// Mailpit from stand/compose.yaml accepts mail without encryption and without authentication
const MAILPIT = { host: "mailpit", port: 1025, encryption: "none", sender: "TaskTrail <noreply@tasktrail.local>", username: null };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(message, response) {
  console.error(`== stack: ${message}${response ? `: ${response.status} ${response.text.slice(0, 200)}` : ""}`);
  process.exit(1);
}

await waitForWeb();
const session = createSession();
const settings = await session.request("GET", "/v1/settings/public");
if (!settings.ok) fail("server did not return settings", settings);

if (settings.data.registrationOpen) {
  const registered = await session.request("POST", "/v1/auth/register", { json: { ...ADMIN, serviceUrl: WEB } });
  if (registered.status !== 201) fail("first account not created", registered);
  // The server checks the SMTP connection before saving, and Mailpit may not have opened its port yet
  let saved;
  for (let attempt = 0; attempt < 10; attempt++) {
    saved = await session.request("PUT", "/v1/admin/settings/mail", { json: MAILPIT });
    if (saved.status !== 502) break;
    await sleep(1000);
  }
  if (!saved.ok) fail("mail not connected to Mailpit", saved);
  await session.request("POST", "/v1/auth/logout");
  console.log("== stack: created the first account (service administrator), mail connected to Mailpit");
} else if (!settings.data.mailEnabled) {
  console.log(
    "== stack: mail is disabled in the admin settings: no emails, invitation links come in API responses. " +
      "To reconnect Mailpit: scripts/dev.sh reset and up",
  );
}

console.log(`== stack is running
  web      ${WEB}   Chrome or Firefox: Safari does not accept Secure cookies over http
  sign-in  ${ADMIN.email}, password ${ADMIN.password} (service administrator)
  mail     ${MAIL}   Mailpit: invitation and password reset emails
  Swagger  ${WEB}/api/docs/   in the same browser after signing in as the administrator
Stop: scripts/dev.sh down; wipe the database and files: scripts/dev.sh reset.`);
