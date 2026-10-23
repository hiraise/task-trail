// Full-page screenshots of the running local stack for agents (ADR-0040). Run it through
// scripts/dev.sh screens: it installs the pinned Playwright and passes PLAYWRIGHT_DIR.
//
//   scripts/dev.sh screens <dir> <path>... [--widths 393,768,1200] [--click <selector>]...
//
// Signs in as the stack administrator, opens each path at each width, performs the clicks in order
// (to open a modal or a picker) and saves <dir>/<path-slug>-<width>.png. Prints one line per file and
// its problems (console errors, failed clicks), so the caller reads text first and opens only
// the images it needs.
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { ADMIN, WEB } from "./stand-api.mjs";

const args = process.argv.slice(2);
const paths = [];
const clicks = [];
let widths = [393, 768, 1200];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--widths") widths = args[++i].split(",").map(Number);
  else if (args[i] === "--click") clicks.push(args[++i]);
  else paths.push(args[i]);
}
const outDir = paths.shift();
if (!outDir || paths.length === 0 || !process.env.PLAYWRIGHT_DIR) {
  console.error("Usage: scripts/dev.sh screens <dir> <path>... [--widths 393,768,1200] [--click <selector>]...");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const { chromium } = createRequire(join(process.env.PLAYWRIGHT_DIR, "package.json"))("playwright");
const browser = await chromium.launch();
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 852 : 900 } });
    // The request context shares cookies with the pages: the session set here signs the pages in
    const login = await context.request.post(`${WEB}/api/v1/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    if (!login.ok()) throw new Error(`sign-in failed: ${login.status()} (is the stack up? scripts/dev.sh up)`);
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => message.type() === "error" && errors.push(`console: ${message.text()}`));
    page.on("pageerror", (error) => errors.push(`page error: ${error.message}`));
    for (const path of paths) {
      errors.length = 0;
      await page.goto(WEB + path, { waitUntil: "networkidle" });
      for (const selector of clicks) {
        try {
          await page.locator(selector).first().click({ timeout: 5000 });
          await page.waitForLoadState("networkidle");
        } catch {
          // The screenshot still shows the page, so the caller sees why the element was not there
          errors.push(`click ${selector}: no clickable element within 5 s`);
        }
      }
      await page.waitForTimeout(300); // let transitions finish
      const slug = path.replace(/^\/+|\/+$/g, "").replace(/[^A-Za-z0-9-]+/g, "_") || "home";
      const file = resolve(outDir, `${slug}${clicks.length ? "-clicked" : ""}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
      for (const error of errors) console.log(`  ! ${error}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
