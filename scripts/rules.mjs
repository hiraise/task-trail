// Правила проекта, которые ловятся поиском по коду (ADR-0009). Запуск: scripts/dev.sh rules.
// Каждая проверка ссылается на ADR, из которого она следует.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { basename, dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const hints = [];

// Файлы репозитория с точным регистром путей: закоммиченные и новые, кроме игнорируемых.
// -z — чтобы пути с кириллицей не приходили в кавычках; --deduplicate — при конфликте слияния.
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

// ADR: имя, номер, заголовок и статус по шаблону; строка индекса повторяет решение, статус
// и «Затрагивает» из самого ADR (docs/adr/template.md)
function checkAdr() {
  const dir = "docs/adr";
  const rows = new Map();
  for (const line of read(`${dir}/README.md`).split("\n")) {
    if (!line.startsWith("| [")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const file = /^\[\d{4}\]\(([^)]+)\)$/.exec(cells[0])?.[1];
    if (!file || cells.length !== 4) {
      errors.push(`${dir}/README.md: строка индекса не по образцу «| [NNNN](файл) | решение | статус | затрагивает |»: ${line}`);
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
      errors.push(`${path}: имя не по шаблону NNNN-slug.md`);
      continue;
    }
    const number = match[1];
    if (numbers.has(number)) errors.push(`${dir}: номер ${number} у двух ADR — ${numbers.get(number)} и ${file}`);
    numbers.set(number, file);

    const text = read(path);
    const title = /^# ADR-(\d{4}): (.+)$/m.exec(text.split("\n")[0]);
    if (!title || title[1] !== number) errors.push(`${path}: заголовок должен начинаться с «# ADR-${number}: »`);
    const status = field(text, "Статус");
    if (!status || !/^(Предложено|Принято|Отменено|Заменено \[ADR-\d{4}\]\(\d{4}-[a-z0-9-]+\.md\))$/.test(status)) {
      errors.push(`${path}: статус «${status ?? "нет"}» не по шаблону`);
    }
    const affects = field(text, "Затрагивает");
    if (!affects) errors.push(`${path}: нет поля «Затрагивает»`);

    const row = rows.get(file);
    if (!row) {
      errors.push(`${dir}/README.md: нет строки для ${file}`);
      continue;
    }
    rows.delete(file);
    if (title && row[1] !== title[2]) errors.push(`${dir}/README.md: решение ${file} не совпадает с заголовком ADR`);
    if (status && row[2].split(" ")[0] !== status.split(" ")[0]) {
      errors.push(`${dir}/README.md: у ${file} статус «${row[2]}», а в ADR — «${status}»`);
    }
    if (affects && row[3] !== affects) errors.push(`${dir}/README.md: «Затрагивает» у ${file} не совпадает с ADR — скопируй из ADR`);
  }
  for (const file of rows.keys()) errors.push(`${dir}/README.md: строка для несуществующего ${file}`);
}

// Номер нового ADR могли занять параллельные сессии (docs/adr/template.md): ADR этой ветки, которых
// нет в origin/main, сверяются с main, с ветками origin и с локальными ветками других worktree,
// ещё не влитыми в main. Ветки origin видны после git fetch; в CI origin/main нет — проверка молчит.
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
  const mine = new Map(); // номер → новый ADR этой ветки
  for (const path of FILES.filter((file) => dirname(file) === dir)) {
    const file = basename(path);
    if (numberOf(file) && !inMain.has(file)) mine.set(numberOf(file), file);
  }
  if (mine.size === 0) return;

  const conflict = (other, where) => {
    const own = mine.get(numberOf(other));
    if (own && own !== other) {
      errors.push(`${dir}/${own}: номер ${numberOf(other)} занят в ${where} (${other}) — кому он остаётся, в ${dir}/template.md`);
    }
  };
  for (const file of inMain) conflict(file, "origin/main");

  const current = git("branch", "--show-current").trim();
  const refs = git("for-each-ref", "--format=%(refname:short)", "refs/heads", "refs/remotes/origin").split("\n");
  for (const ref of refs) {
    if (!ref || ["origin", "origin/HEAD", current, `origin/${current}`].includes(ref)) continue;
    // Ветка влита в main или вся вошла в эту ветку — её ADR не чужие
    if (succeeds("merge-base", "--is-ancestor", ref, "origin/main") || succeeds("merge-base", "--is-ancestor", ref, "HEAD")) continue;
    for (const file of adrsIn(ref)) if (!inMain.has(file)) conflict(file, `ветке ${ref}`);
  }
}

// Относительные ссылки в Markdown ведут на файлы и папки репозитория с точным регистром
// (CLAUDE.md, «Где что описано»): CI на Linux различает регистр, macOS — нет.
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
        errors.push(`${path}: ссылка с некорректной кодировкой ${target}`);
        continue;
      }
      const resolved = (
        file.startsWith("/") ? posix.normalize(file.slice(1)) : posix.join(posix.dirname(path), file)
      ).replace(/\/$/, "");
      if (!FILE_SET.has(resolved) && !DIR_SET.has(resolved)) {
        errors.push(`${path}: ссылка на несуществующий ${target}`);
      }
    }
  }
}

// Каждый импортируемый в вебе пакет объявлен в web/package.json (ADR-0006)
function checkWebImports() {
  const pkg = JSON.parse(read("web/package.json"));
  const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const builtins = new Set(builtinModules);
  const sources = FILES.filter(
    (file) => /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(file) && (file.startsWith("web/src/") || /^web\/[^/]+$/.test(file)),
  );
  // `… from "x"`, `import "x"` в начале строки и `import("x")`; комментарии вырезаются,
  // строки вроде `"import"` в конфигах не задеваются
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
  for (const [name, path] of missing) errors.push(`web/package.json: пакет ${name} не объявлен, а импортируется (${path})`);
}

// Компонентов с Mobile/Desktop в имени не становится больше: новые экраны — один адаптивный
// компонент (ADR-0008). Слил пару — снизь порог; превышение — ошибка, снижение — подсказка.
const DEVICE_SPLIT_LIMIT = { Mobile: 38, Desktop: 33 };

function checkDeviceSplit() {
  const components = FILES.filter(
    (file) => file.startsWith("web/src/") && file.endsWith(".tsx") && !file.endsWith(".test.tsx"),
  );
  for (const [kind, limit] of Object.entries(DEVICE_SPLIT_LIMIT)) {
    const count = components.filter((file) => basename(file).includes(kind)).length;
    if (count > limit) {
      errors.push(`web/src: компонентов с ${kind} в имени — ${count}, порог ${limit}: новый экран делай одним адаптивным компонентом (ADR-0008)`);
    } else if (count < limit) {
      hints.push(`компонентов с ${kind} в имени стало ${count} — снизь порог в scripts/rules.mjs с ${limit} до ${count}`);
    }
  }
}

// Цвета, тени и шрифты — из переменных web/src/styles/ (ADR-0008). Объявлений с цветом значением
// в CSS вне web/src/styles/ не становится больше: убрал — снизь порог. Шрифт — только переменной.
const STYLE_LITERAL_LIMIT = 21;

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
        errors.push(`${path}: шрифт — переменной из web/src/styles/, а не значением (ADR-0008): ${declaration.trim()}`);
      } else if (colorRe.test(literal)) {
        literals.push(`${path}: ${declaration.trim()}`);
      }
    }
  }
  if (literals.length > STYLE_LITERAL_LIMIT) {
    errors.push(
      `web/src: цветов и теней значениями в CSS — ${literals.length}, порог ${STYLE_LITERAL_LIMIT}: бери переменные ` +
        `из web/src/styles/globals.css, новой нет — добавь её туда (ADR-0008). Все такие объявления:\n  ${literals.join("\n  ")}`,
    );
  } else if (literals.length < STYLE_LITERAL_LIMIT) {
    hints.push(`цветов и теней значениями в CSS стало ${literals.length} — снизь порог в scripts/rules.mjs с ${STYLE_LITERAL_LIMIT} до ${literals.length}`);
  }
}

// Действия GitHub закреплены по SHA коммита с версией в комментарии (ADR-0009)
function checkPinnedActions() {
  for (const path of FILES.filter((file) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file))) {
    read(path)
      .split("\n")
      .forEach((line, i) => {
        const uses = /^\s*(?:-\s+)?uses:\s*["']?([^\s"']+)["']?(.*)$/.exec(line);
        if (!uses || uses[1].startsWith("./")) return;
        if (!/@[0-9a-f]{40}$/.test(uses[1]) || !/^\s+#\s*v?\d/.test(uses[2])) {
          errors.push(`${path}:${i + 1}: действие закрепляй по SHA с версией в комментарии — uses: <действие>@<SHA из 40 символов> # vX.Y.Z (ADR-0009)`);
        }
      });
  }
}

// Порты стенда слушают только 127.0.0.1 (ADR-0010): стенд не виден из сети
function checkStandPorts() {
  const path = "stand/compose.yaml";
  if (!FILE_SET.has(path)) return;
  const wrong = (i, port) => errors.push(`${path}:${i + 1}: порт ${port} — только на 127.0.0.1, в короткой записи "127.0.0.1:<порт>:<порт>" (ADR-0010)`);
  let portsIndent = null; // отступ ключа ports:, пока идёт его список
  read(path)
    .split("\n")
    .forEach((line, i) => {
      const indent = line.search(/\S/);
      if (indent < 0 || line.trim().startsWith("#")) return;
      if (portsIndent !== null && indent <= portsIndent) portsIndent = null;
      if (/^\s*network_mode:\s*["']?host/.test(line)) errors.push(`${path}:${i + 1}: network_mode: host открывает порты стенда в сеть (ADR-0010)`);
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

// Текущее время сервер берёт из Clock (ADR-0022): time.Now, time.Since и time.Until — только
// в реализации Clock, в тестах и для замера длительности в middleware/log.go. Остальных вызовов
// не становится больше: перевёл на Clock — снизь порог.
const TIME_CALL_LIMIT = 11;

function checkClock() {
  const allowed = (path) =>
    path.endsWith("_test.go") ||
    path.startsWith("server/test/") ||
    path.startsWith("server/internal/infrastructure/service/clock/") ||
    path === "server/internal/presentation/http/middleware/log.go";
  const calls = [];
  for (const path of FILES.filter((file) => file.startsWith("server/") && file.endsWith(".go") && !allowed(file))) {
    // Комментарии вырезаются с сохранением переводов строк, чтобы номера строк совпадали
    const code = read(path).replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ""));
    code.split("\n").forEach((line, i) => {
      const callCount = line.replace(/\/\/.*$/, "").match(/\btime\.(?:Now|Since|Until)\(/g)?.length ?? 0;
      for (let n = 0; n < callCount; n++) calls.push(`${path}:${i + 1}`);
    });
  }
  if (calls.length > TIME_CALL_LIMIT) {
    errors.push(
      `server: вызовов time.Now/Since/Until вне Clock — ${calls.length}, порог ${TIME_CALL_LIMIT}: бери время из Clock (ADR-0022). ` +
        `Все вызовы:\n  ${calls.join("\n  ")}`,
    );
  } else if (calls.length < TIME_CALL_LIMIT) {
    hints.push(`вызовов time.Now/Since/Until вне Clock стало ${calls.length} — снизь порог в scripts/rules.mjs с ${TIME_CALL_LIMIT} до ${calls.length}`);
  }
}

// Контракт API (ADR-0019, ADR-0020): kin-openapi и server/test/ — только в тестах сервера,
// тесты обработчиков v1 проверяют ответы по контракту, сгенерированные типы веба импортирует
// только слой infrastructure и наружу их не переэкспортирует
function checkContract() {
  const withoutComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const path of FILES.filter((file) => file.startsWith("server/") && file.endsWith(".go"))) {
    const code = withoutComments(read(path));
    if (!path.endsWith("_test.go") && !path.startsWith("server/test/")) {
      if (code.includes('"github.com/getkin/kin-openapi')) {
        errors.push(`${path}: kin-openapi импортируется только в тестах и server/test/ (ADR-0019)`);
      }
      if (code.includes('"task-trail/test/')) {
        errors.push(`${path}: server/test/ импортируется только из тестов — иначе kin-openapi попадёт в бинарник (ADR-0019)`);
      }
    }
    if (dirname(path) === "server/internal/presentation/http/v1" && path.endsWith("_test.go") && !code.includes("contract.Load(")) {
      errors.push(`${path}: тест обработчика проверяет ответы по контракту — contract.Load(t).Check(...) (ADR-0019)`);
    }
  }
  // Сгенерированный тип с именем глобального заслонил бы его: `Error`, `Date`, `File`…
  const globals = new Set(["Array", "Blob", "Boolean", "Date", "Error", "File", "FormData", "Function", "Headers",
    "JSON", "Map", "Number", "Object", "Promise", "Record", "RegExp", "Request", "Response", "Set", "String",
    "Symbol", "URL"]);
  const schemas = /^ {2}schemas:\n([\s\S]*?)(?=^\S|^ {2}\S|(?![\s\S]))/m.exec(read("api/openapi.yaml"))?.[1] ?? "";
  for (const [, name] of schemas.matchAll(/^ {4}([A-Za-z0-9_]+):/gm)) {
    if (globals.has(name)) errors.push(`api/openapi.yaml: схема ${name} заслонит глобальный тип TypeScript в вебе — переименуй (ADR-0020)`);
  }

  // Путь импорта разрешается относительно файла: и `@/infrastructure/api/generated`,
  // и `./generated` из соседнего index.ts ведут в одну папку
  const generated = "web/src/infrastructure/api/generated";
  const resolveSpec = (file, spec) =>
    spec.startsWith("@/") ? `web/src/${spec.slice(2)}` : spec.startsWith(".") ? posix.join(posix.dirname(file), spec) : null;
  const statementRe = /\b(import|export)\b[^;'"]*?\bfrom\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/g;
  for (const path of FILES.filter((file) => file.startsWith("web/src/") && /\.(ts|tsx)$/.test(file) && !file.startsWith(`${generated}/`))) {
    for (const [statement, keyword = "import", fromSpec, dynamicSpec] of withoutComments(read(path)).matchAll(statementRe)) {
      const target = resolveSpec(path, fromSpec ?? dynamicSpec);
      if (target !== generated && !target?.startsWith(`${generated}/`)) continue;
      if (!path.startsWith("web/src/infrastructure/")) {
        errors.push(`${path}: типы из ${generated}/ импортирует только слой infrastructure (ADR-0020)`);
      } else if (keyword === "export") {
        errors.push(`${path}: типы из ${generated}/ не переэкспортируются — иначе они уйдут из infrastructure (ADR-0020): ${statement.trim()}`);
      }
    }
  }
}

// Слои сервера (ADR-0007): domain не импортирует application, infrastructure и presentation,
// application — infrastructure и presentation. Тестам можно: они собирают сценарий целиком.
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
        errors.push(`${path}: слой ${layer.split("/")[2]} не импортирует ${target} (ADR-0007)`);
      }
    }
  }
}

checkAdr();
checkAdrNumbers();
checkStyleTokens();
checkPinnedActions();
checkStandPorts();
checkClock();
checkLinks();
checkWebImports();
checkDeviceSplit();
checkContract();
checkServerLayers();

for (const hint of hints) console.log(`подсказка: ${hint}`);
if (errors.length > 0) {
  console.error(`Правила проекта нарушены (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("== rules: правила проекта соблюдены");
