// Project rules that a code search can catch (ADR-0009). Run: scripts/dev.sh rules.
// Each check refers to the ADR it follows from.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { basename, dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const hints = [];

// Repository files with exact path case: committed and new, except ignored ones.
// -z keeps paths with Cyrillic from coming quoted; --deduplicate handles a merge conflict.
const FILES = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--deduplicate"],
  { cwd: ROOT, encoding: "utf8" },
)
  .split("\0")
  .filter((file) => file && existsSync(join(ROOT, file)));
const FILE_SET = new Set(FILES);
const DIR_SET = new Set([
  ".",
  ...FILES.flatMap((file) => {
    const parts = file.split("/");
    return parts.slice(1).map((_, i) => parts.slice(0, i + 1).join("/"));
  }),
]);

const read = (file) => readFileSync(join(ROOT, file), "utf8");
const field = (text, name) => new RegExp(`^- \\*\\*${name}:\\*\\* (.+)$`, "m").exec(text)?.[1];

// ADR: file name, number, title and status follow the template; the index row repeats the decision,
// status and Affects from the ADR itself (docs/adr/template.md)
function checkAdr() {
  const dir = "docs/adr";
  const rows = new Map();
  for (const line of read(`${dir}/README.md`).split("\n")) {
    if (!line.startsWith("| [")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const file = /^\[\d{4}\]\(([^)]+)\)$/.exec(cells[0])?.[1];
    if (!file || cells.length !== 4) {
      errors.push(`${dir}/README.md: index row does not match "| [NNNN](file) | decision | status | affects |": ${line}`);
      continue;
    }
    rows.set(file, cells);
  }

  const numbers = new Map();
  const adrFiles = FILES.filter(
    (path) => dirname(path) === dir && path.endsWith(".md") && !["README.md", "template.md"].includes(basename(path)),
  );
  for (const path of adrFiles) {
    const file = basename(path);
    const match = /^(\d{4})-[a-z0-9-]+\.md$/.exec(file);
    if (!match) {
      errors.push(`${path}: file name does not match NNNN-slug.md`);
      continue;
    }
    const number = match[1];
    if (numbers.has(number)) errors.push(`${dir}: number ${number} is used by two ADRs — ${numbers.get(number)} and ${file}`);
    numbers.set(number, file);

    const text = read(path);
    const title = /^# ADR-(\d{4}): (.+)$/m.exec(text.split("\n")[0]);
    if (!title || title[1] !== number) errors.push(`${path}: title must start with "# ADR-${number}: "`);
    const status = field(text, "Status");
    if (!status || !/^(Proposed|Accepted|Deprecated|Superseded by \[ADR-\d{4}\]\(\d{4}-[a-z0-9-]+\.md\))$/.test(status)) {
      errors.push(`${path}: status "${status ?? "none"}" does not match the template`);
    }
    const affects = field(text, "Affects");
    if (!affects) errors.push(`${path}: no "Affects" field`);

    const row = rows.get(file);
    if (!row) {
      errors.push(`${dir}/README.md: no index row for ${file}`);
      continue;
    }
    rows.delete(file);
    if (title && row[1] !== title[2]) errors.push(`${dir}/README.md: decision of ${file} differs from the ADR title`);
    if (status && row[2].split(" ")[0] !== status.split(" ")[0]) {
      errors.push(`${dir}/README.md: ${file} has status "${row[2]}" in the index, but "${status}" in the ADR`);
    }
    if (affects && row[3] !== affects) errors.push(`${dir}/README.md: "Affects" of ${file} differs from the ADR — copy it from the ADR`);
  }
  for (const file of rows.keys()) errors.push(`${dir}/README.md: index row for a missing ${file}`);
}

// Parallel sessions may have taken the number of a new ADR (docs/adr/template.md): ADRs of this branch that
// are not in origin/main are compared with main, with origin branches and with local branches of other worktrees
// not yet merged into main. Origin branches are visible after git fetch; CI has no origin/main, so the check is silent.
function checkAdrNumbers() {
  const git = (...args) =>
    execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const succeeds = (...args) => {
    try {
      git(...args);
      return true;
    } catch {
      return false;
    }
  };
  if (!succeeds("rev-parse", "-q", "--verify", "origin/main^{commit}")) return;

  const dir = "docs/adr";
  const numberOf = (file) => /^(\d{4})-[a-z0-9-]+\.md$/.exec(file)?.[1];
  const adrsIn = (ref) => git("ls-tree", "--name-only", ref, `${dir}/`).split("\n").map((path) => basename(path)).filter(numberOf);
  const inMain = new Set(adrsIn("origin/main"));
  const mine = new Map(); // number → new ADR of this branch
  for (const path of FILES.filter((file) => dirname(file) === dir)) {
    const file = basename(path);
    if (numberOf(file) && !inMain.has(file)) mine.set(numberOf(file), file);
  }
  if (mine.size === 0) return;

  const conflict = (other, where) => {
    const own = mine.get(numberOf(other));
    if (own && own !== other) {
      errors.push(`${dir}/${own}: number ${numberOf(other)} is taken in ${where} (${other}); who keeps it: see ${dir}/template.md`);
    }
  };
  for (const file of inMain) conflict(file, "origin/main");

  const current = git("branch", "--show-current").trim();
  const refs = git("for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes/origin").split("\n");
  for (const ref of refs) {
    if (!ref || ["origin", "origin/HEAD", current, `origin/${current}`].includes(ref)) continue;
    // The branch is merged into main or fully contained in this branch: its ADRs are not someone else's
    if (succeeds("merge-base", "--is-ancestor", ref, "origin/main") || succeeds("merge-base", "--is-ancestor", ref, "HEAD")) continue;
    for (const file of adrsIn(ref)) if (!inMain.has(file)) conflict(file, `branch ${ref}`);
  }
}

// Relative links in Markdown lead to repository files and folders with exact case
// (CLAUDE.md, "Where things are"): CI on Linux is case-sensitive, macOS is not.
function checkLinks() {
  const withoutCode = (text) =>
    text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "").replace(/`[^`\n]*`/g, "");
  for (const path of FILES.filter((file) => file.endsWith(".md"))) {
    for (const [, target] of withoutCode(read(path)).matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
      let file;
      try {
        file = decodeURIComponent(target.split("#")[0]);
      } catch {
        errors.push(`${path}: link with invalid encoding ${target}`);
        continue;
      }
      const resolved = (
        file.startsWith("/") ? posix.normalize(file.slice(1)) : posix.join(posix.dirname(path), file)
      ).replace(/\/$/, "");
      if (!FILE_SET.has(resolved) && !DIR_SET.has(resolved)) {
        errors.push(`${path}: link to a missing ${target}`);
      }
    }
  }
}

// Every package imported in the web is declared in web/package.json (ADR-0006)
function checkWebImports() {
  const pkg = JSON.parse(read("web/package.json"));
  const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const builtins = new Set(builtinModules);
  const sources = FILES.filter(
    (file) => /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(file) && (file.startsWith("web/src/") || /^web\/[^/]+$/.test(file)),
  );
  // `… from "x"`, `import "x"` at the start of a line and `import("x")`; comments are stripped,
  // strings like `"import"` in configs are not matched
  const importRe = /\sfrom\s+["']([^"']+)["']|^\s*import\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/gm;
  const missing = new Map();
  for (const path of sources) {
    const code = read(path).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const match of code.matchAll(importRe)) {
      const spec = (match[1] ?? match[2] ?? match[3]).split("?")[0];
      if (/^(\.|\/|@\/|node:|virtual:)/.test(spec)) continue;
      const parts = spec.split("/");
      const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
      if (!builtins.has(name) && !declared.has(name) && !missing.has(name)) missing.set(name, path);
    }
  }
  for (const [name, path] of missing) errors.push(`web/package.json: package ${name} is imported but not declared (${path})`);
}

// Components with Mobile/Desktop in the name do not grow in number: a new screen is one adaptive
// component (ADR-0008). Merged a pair — lower the limit; exceeding it is an error, going below is a hint.
const DEVICE_SPLIT_LIMIT = { Mobile: 10, Desktop: 6 };

function checkDeviceSplit() {
  const components = FILES.filter(
    (file) => file.startsWith("web/src/") && file.endsWith(".tsx") && !file.endsWith(".test.tsx"),
  );
  for (const [kind, limit] of Object.entries(DEVICE_SPLIT_LIMIT)) {
    const count = components.filter((file) => basename(file).includes(kind)).length;
    if (count > limit) {
      errors.push(`web/src: components with ${kind} in the name: ${count}, limit ${limit}: make a new screen one adaptive component (ADR-0008)`);
    } else if (count < limit) {
      hints.push(`components with ${kind} in the name are down to ${count}: lower the limit in scripts/rules.mjs from ${limit} to ${count}`);
    }
  }
}

// Colors, shadows and fonts come from variables in web/src/styles/ (ADR-0008). Declarations with a literal color
// in CSS outside web/src/styles/ do not grow in number: removed one — lower the limit. A font is only a variable.
const STYLE_LITERAL_LIMIT = 12;

function checkStyleTokens() {
  const colorRe =
    /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(|\b(?:black|white|red|green|blue|gray|grey|silver|orange|yellow|purple|pink|brown|navy|teal)\b/i;
  const literals = [];
  const sheets = FILES.filter((file) => file.startsWith("web/src/") && file.endsWith(".css") && !file.startsWith("web/src/styles/"));
  for (const path of sheets) {
    const css = read(path).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [declaration, property, value] of css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)(?=[;}])/g)) {
      const literal = value.replace(/var\([^)]*\)/g, "");
      if (property === "font-family" && !/^(var\(.*\)|inherit)$/.test(value.trim())) {
        errors.push(`${path}: font must be a variable from web/src/styles/, not a literal value (ADR-0008): ${declaration.trim()}`);
      } else if (colorRe.test(literal)) {
        literals.push(`${path}: ${declaration.trim()}`);
      }
    }
  }
  if (literals.length > STYLE_LITERAL_LIMIT) {
    errors.push(
      `web/src: literal colors and shadows in CSS: ${literals.length}, limit ${STYLE_LITERAL_LIMIT}: use variables ` +
        `from web/src/styles/globals.css; if there is none, add it there (ADR-0008). All such declarations:\n  ${literals.join("\n  ")}`,
    );
  } else if (literals.length < STYLE_LITERAL_LIMIT) {
    hints.push(`literal colors and shadows in CSS are down to ${literals.length}: lower the limit in scripts/rules.mjs from ${STYLE_LITERAL_LIMIT} to ${literals.length}`);
  }
}

// GitHub actions are pinned by commit SHA with the version in a comment (ADR-0009)
function checkPinnedActions() {
  for (const path of FILES.filter((file) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file))) {
    read(path)
      .split("\n")
      .forEach((line, i) => {
        const uses = /^\s*(?:-\s+)?uses:\s*["']?([^\s"']+)["']?(.*)$/.exec(line);
        if (!uses || uses[1].startsWith("./")) return;
        if (!/@[0-9a-f]{40}$/.test(uses[1]) || !/^\s+#\s*v?\d/.test(uses[2])) {
          errors.push(`${path}:${i + 1}: pin the action by SHA with the version in a comment: uses: <action>@<40-character SHA> # vX.Y.Z (ADR-0009)`);
        }
      });
  }
}

// Local stack ports listen only on 127.0.0.1 (ADR-0010): the stack is not visible from the network
function checkStandPorts() {
  const path = "stand/compose.yaml";
  if (!FILE_SET.has(path)) return;
  const wrong = (i, port) => errors.push(`${path}:${i + 1}: port ${port} must be bound to 127.0.0.1 only, in the short form "127.0.0.1:<port>:<port>" (ADR-0010)`);
  let portsIndent = null; // indent of the ports: key while its list goes on
  read(path)
    .split("\n")
    .forEach((line, i) => {
      const indent = line.search(/\S/);
      if (indent < 0 || line.trim().startsWith("#")) return;
      if (portsIndent !== null && indent <= portsIndent) portsIndent = null;
      if (/^\s*network_mode:\s*["']?host/.test(line)) errors.push(`${path}:${i + 1}: network_mode: host exposes the stack's ports to the network (ADR-0010)`);
      const inline = /^\s*ports:\s*\[(.*)\]/.exec(line);
      if (inline) {
        for (const port of inline[1].split(",").map((item) => item.trim().replace(/^["']|["']$/g, ""))) {
          if (port && !port.startsWith("127.0.0.1:")) wrong(i, port);
        }
      } else if (/^\s*ports:\s*$/.test(line)) {
        portsIndent = indent;
      } else if (portsIndent !== null) {
        const port = /^\s*-\s*["']?([^"'\s#]+)/.exec(line)?.[1];
        if (port && !port.startsWith("127.0.0.1:")) wrong(i, port);
      }
    });
}

// The server takes the current time from Clock (ADR-0022): time.Now, time.Since and time.Until only
// in the Clock implementation, in tests and for measuring duration in middleware/log.go. Other calls
// do not grow in number: moved one to Clock — lower the limit.
const TIME_CALL_LIMIT = 0;

function checkClock() {
  const allowed = (path) =>
    path.endsWith("_test.go") ||
    path.startsWith("server/test/") ||
    path.startsWith("server/internal/infrastructure/service/clock/") ||
    path === "server/internal/presentation/http/middleware/log.go";
  const calls = [];
  for (const path of FILES.filter((file) => file.startsWith("server/") && file.endsWith(".go") && !allowed(file))) {
    // Comments are stripped keeping line breaks, so line numbers match
    const code = read(path).replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ""));
    code.split("\n").forEach((line, i) => {
      const callCount = line.replace(/\/\/.*$/, "").match(/\btime\.(?:Now|Since|Until)\(/g)?.length ?? 0;
      for (let n = 0; n < callCount; n++) calls.push(`${path}:${i + 1}`);
    });
  }
  if (calls.length > TIME_CALL_LIMIT) {
    errors.push(
      `server: time.Now/Since/Until calls outside Clock: ${calls.length}, limit ${TIME_CALL_LIMIT}: take the time from Clock (ADR-0022). ` +
        `All calls:\n  ${calls.join("\n  ")}`,
    );
  } else if (calls.length < TIME_CALL_LIMIT) {
    hints.push(`time.Now/Since/Until calls outside Clock are down to ${calls.length}: lower the limit in scripts/rules.mjs from ${TIME_CALL_LIMIT} to ${calls.length}`);
  }
}

// API contract (ADR-0019, ADR-0020): kin-openapi and server/test/ only in server tests,
// v1 handler tests check responses against the contract, generated web types are imported
// only by the infrastructure layer and are not re-exported from it
function checkContract() {
  const withoutComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const path of FILES.filter((file) => file.startsWith("server/") && file.endsWith(".go"))) {
    const code = withoutComments(read(path));
    if (!path.endsWith("_test.go") && !path.startsWith("server/test/")) {
      if (code.includes('"github.com/getkin/kin-openapi')) {
        errors.push(`${path}: kin-openapi is imported only in tests and server/test/ (ADR-0019)`);
      }
      if (code.includes('"task-trail/test/')) {
        errors.push(`${path}: server/test/ is imported only from tests, otherwise kin-openapi ends up in the binary (ADR-0019)`);
      }
    }
    if (dirname(path) === "server/internal/presentation/http/v1" && path.endsWith("_test.go") && !code.includes("contract.Load(")) {
      errors.push(`${path}: a handler test checks responses against the contract: contract.Load(t).Check(...) (ADR-0019)`);
    }
  }
  // A generated type named like a global one would shadow it: `Error`, `Date`, `File`…
  const globals = new Set(["Array", "Blob", "Boolean", "Date", "Error", "File", "FormData", "Function", "Headers",
    "JSON", "Map", "Number", "Object", "Promise", "Record", "RegExp", "Request", "Response", "Set", "String",
    "Symbol", "URL"]);
  const schemas = /^ {2}schemas:\n([\s\S]*?)(?=^\S|^ {2}\S|(?![\s\S]))/m.exec(read("api/openapi.yaml"))?.[1] ?? "";
  for (const [, name] of schemas.matchAll(/^ {4}([A-Za-z0-9_]+):/gm)) {
    if (globals.has(name)) errors.push(`api/openapi.yaml: schema ${name} would shadow a global TypeScript type in the web; rename it (ADR-0020)`);
  }

  // The import path is resolved relative to the file: both `@/infrastructure/api/generated`
  // and `./generated` from the neighboring index.ts lead to the same folder
  const generated = "web/src/infrastructure/api/generated";
  const resolveSpec = (file, spec) =>
    spec.startsWith("@/") ? `web/src/${spec.slice(2)}` : spec.startsWith(".") ? posix.join(posix.dirname(file), spec) : null;
  const statementRe = /\b(import|export)\b[^;'"]*?\bfrom\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/g;
  for (const path of FILES.filter((file) => file.startsWith("web/src/") && /\.(ts|tsx)$/.test(file) && !file.startsWith(`${generated}/`))) {
    for (const [statement, keyword = "import", fromSpec, dynamicSpec] of withoutComments(read(path)).matchAll(statementRe)) {
      const target = resolveSpec(path, fromSpec ?? dynamicSpec);
      if (target !== generated && !target?.startsWith(`${generated}/`)) continue;
      if (!path.startsWith("web/src/infrastructure/")) {
        errors.push(`${path}: types from ${generated}/ are imported only by the infrastructure layer (ADR-0020)`);
      } else if (keyword === "export") {
        errors.push(`${path}: types from ${generated}/ are not re-exported, otherwise they leak out of infrastructure (ADR-0020): ${statement.trim()}`);
      }
    }
  }
}

// The contract is one file (ADR-0023): the server embeds api/openapi.yaml via the api/ module, copies are not needed
function checkContractCopies() {
  for (const path of FILES.filter((file) => basename(file) === "openapi.yaml" && file !== "api/openapi.yaml")) {
    errors.push(`${path}: copy of the contract: the server takes api/openapi.yaml from the api/ module (ADR-0023)`);
  }
}

// Server layers (ADR-0007): domain does not import application, infrastructure and presentation,
// application does not import infrastructure and presentation. Tests may: they assemble the whole scenario.
function checkServerLayers() {
  const forbidden = {
    "server/internal/domain/": ["application", "infrastructure", "presentation"],
    "server/internal/application/": ["infrastructure", "presentation"],
  };
  for (const path of FILES.filter((file) => file.endsWith(".go") && !file.endsWith("_test.go"))) {
    const layer = Object.keys(forbidden).find((prefix) => path.startsWith(prefix));
    if (!layer) continue;
    const code = read(path).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const [, target] of code.matchAll(/"task-trail\/internal\/([a-z]+)[/"]/g)) {
      if (forbidden[layer].includes(target)) {
        errors.push(`${path}: layer ${layer.split("/")[2]} must not import ${target} (ADR-0007)`);
      }
    }
  }
}

// Code comments and the contract's summary/description lines are in English (ADR-0031).
// String literals are skipped: UI texts and emails stay Russian.
function checkCommentLanguage() {
  const cyrillic = /[А-Яа-яЁё]/;
  const report = (path, text, from, comment) => {
    if (!cyrillic.test(comment)) return;
    const line = text.slice(0, from).split("\n").length;
    errors.push(`${path}:${line}: comment in Russian — write it in English (ADR-0031)`);
  };

  // `//` and `/* */` comments; quotes, Go raw strings, JS template and regex literals are skipped
  const scanC = (path, js) => {
    const text = read(path);
    let lastCode = "\n"; // last non-space code character: tells a regex literal from a division
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === "/" && next === "/") {
        const end = text.indexOf("\n", i);
        const stop = end < 0 ? text.length : end;
        report(path, text, i, text.slice(i, stop));
        i = stop - 1;
      } else if (c === "/" && next === "*") {
        const end = text.indexOf("*/", i + 2);
        const stop = end < 0 ? text.length : end + 2;
        const comment = text.slice(i, stop);
        // Report the first Cyrillic line of the block
        const offset = comment.search(cyrillic);
        if (offset >= 0) report(path, text, i + offset, comment);
        i = stop - 1;
      } else if (c === '"' || c === "'" || c === "`") {
        let j = i + 1;
        while (j < text.length && text[j] !== c) {
          if (text[j] === "\\" && !(c === "`" && !js)) j++;
          if (c !== "`" && text[j] === "\n") break;
          j++;
        }
        i = j;
        lastCode = c;
      } else if (js && c === "/" && /[(,=:[!&|?{};+\-*%<>~^\n]/.test(lastCode)) {
        let j = i + 1;
        let inClass = false;
        while (j < text.length && text[j] !== "\n" && (inClass || text[j] !== "/")) {
          if (text[j] === "\\") j++;
          else if (text[j] === "[") inClass = true;
          else if (text[j] === "]") inClass = false;
          j++;
        }
        i = j;
        lastCode = "/";
      } else if (c === "\\") {
        i++;
      } else if (!/\s/.test(c)) {
        lastCode = c;
      } else if (c === "\n" && /[;{}]/.test(lastCode)) {
        lastCode = "\n";
      }
    }
  };

  // `#` or `--` to the end of the line, outside quotes; `#` starts a comment only after a space
  const scanLines = (path, marker) => {
    read(path)
      .split("\n")
      .forEach((line, i) => {
        let quote = null;
        for (let j = 0; j < line.length; j++) {
          const c = line[j];
          if (quote) {
            if (c === "\\" && quote === '"') j++;
            else if (c === quote) quote = null;
          } else if (c === '"' || (c === "'" && marker === "--") || (c === "'" && !/\w/.test(line[j - 1] ?? ""))) {
            quote = c;
          } else if (line.startsWith(marker, j) && (marker === "--" || j === 0 || /\s/.test(line[j - 1]))) {
            if (cyrillic.test(line.slice(j))) errors.push(`${path}:${i + 1}: comment in Russian — write it in English (ADR-0031)`);
            return;
          }
        }
      });
  };

  for (const path of FILES) {
    const name = basename(path);
    if (/\.(go|css)$/.test(path)) scanC(path, false);
    else if (/\.(ts|tsx|js|mjs)$/.test(path)) scanC(path, true);
    else if (/\.(sh|ya?ml)$/.test(path) || name === "Makefile" || name.startsWith("Dockerfile") || /^stand\/.*\.template$/.test(path)) {
      scanLines(path, "#");
    } else if (path.endsWith(".sql")) scanLines(path, "--");
  }

  // Swagger is for developers: summary and description of the contract, block scalars included
  const contract = "api/openapi.yaml";
  let blockIndent = null;
  read(contract)
    .split("\n")
    .forEach((line, i) => {
      const indent = line.search(/\S/);
      if (blockIndent !== null && indent >= 0 && indent <= blockIndent) blockIndent = null;
      const key = /^(\s*)(summary|description):\s*(.*)$/.exec(line);
      const inText = blockIndent !== null || key;
      if (inText && cyrillic.test(line)) errors.push(`${contract}:${i + 1}: ${key?.[2] ?? "description"} in Russian — write it in English (ADR-0031)`);
      if (key && /^[|>][-+]?$/.test(key[3])) blockIndent = key[1].length;
    });
}

checkAdr();
checkAdrNumbers();
checkCommentLanguage();
checkStyleTokens();
checkPinnedActions();
checkStandPorts();
checkClock();
checkLinks();
checkWebImports();
checkDeviceSplit();
checkContract();
checkContractCopies();
checkServerLayers();

for (const hint of hints) console.log(`hint: ${hint}`);
if (errors.length > 0) {
  console.error(`Project rules violated (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("== rules: project rules are followed");
