// Правила проекта, которые ловятся поиском по коду (ADR-0009). Запуск: scripts/dev.sh rules.
// Каждая проверка ссылается на ADR, из которого она следует.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

// Файлы репозитория: закоммиченные и новые, кроме игнорируемых
function repoFiles(...pathspecs) {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", ...pathspecs],
    { cwd: ROOT, encoding: "utf8" },
  )
    .split("\n")
    .filter((file) => file && existsSync(join(ROOT, file)));
}

const read = (file) => readFileSync(join(ROOT, file), "utf8");

// ADR: имя по шаблону, уникальный номер, заголовок, статус и строка в индексе (docs/adr/template.md)
function checkAdr() {
  const dir = "docs/adr";
  const index = read(`${dir}/README.md`);
  const rows = index.split("\n").filter((line) => line.startsWith("| ["));
  const numbers = new Map();
  for (const path of repoFiles(`${dir}/*.md`)) {
    const file = basename(path);
    if (file === "README.md" || file === "template.md") continue;
    const match = /^(\d{4})-[a-z0-9-]+\.md$/.exec(file);
    if (!match) {
      errors.push(`${path}: имя не по шаблону NNNN-slug.md`);
      continue;
    }
    const number = match[1];
    if (numbers.has(number)) {
      errors.push(`${dir}: номер ${number} у двух ADR — ${numbers.get(number)} и ${file}`);
    }
    numbers.set(number, file);

    const text = read(path);
    if (!text.startsWith(`# ADR-${number}: `)) {
      errors.push(`${path}: заголовок должен начинаться с «# ADR-${number}: »`);
    }
    const status = /^- \*\*Статус:\*\* (.+)$/m.exec(text)?.[1];
    const statusOk =
      status &&
      /^(Предложено|Принято|Отменено|Заменено \[ADR-\d{4}\]\(\d{4}-[a-z0-9-]+\.md\))$/.test(status);
    if (!statusOk) errors.push(`${path}: статус «${status ?? "нет"}» не по шаблону`);

    const row = rows.find((line) => line.includes(`](${file})`));
    if (!row) {
      errors.push(`${dir}/README.md: нет строки для ${file}`);
    } else if (status) {
      const indexStatus = row.split("|")[3]?.trim() ?? "";
      if (indexStatus.split(" ")[0] !== status.split(" ")[0]) {
        errors.push(`${dir}/README.md: у ${file} статус «${indexStatus}», а в ADR — «${status}»`);
      }
    }
  }
}

// Относительные ссылки в Markdown ведут на существующие файлы (CLAUDE.md, «Где что описано»)
function checkLinks() {
  for (const path of repoFiles("*.md")) {
    const text = read(path).replace(/```[\s\S]*?```/g, "");
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
      const file = decodeURI(target.split("#")[0]);
      if (!existsSync(resolve(ROOT, dirname(path), file))) {
        errors.push(`${path}: ссылка на несуществующий ${target}`);
      }
    }
  }
}

// Каждый импортируемый в вебе пакет объявлен в web/package.json (ADR-0006)
function checkWebImports() {
  const pkg = JSON.parse(read("web/package.json"));
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  const builtins = new Set(builtinModules);
  const files = repoFiles("web/src", "web/*.ts", "web/*.js").filter((file) =>
    /\.(ts|tsx|js|mjs)$/.test(file),
  );
  // `… from "x"`, `import "x"` в начале строки и `import("x")`; строки вроде `"import"` в конфигах не задеваются
  const importRe = /\sfrom\s+["']([^"']+)["']|^\s*import\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/gm;
  const missing = new Map();
  for (const path of files) {
    for (const match of read(path).matchAll(importRe)) {
      const spec = (match[1] ?? match[2] ?? match[3]).split("?")[0];
      if (/^(\.|\/|@\/|node:|virtual:)/.test(spec)) continue;
      const parts = spec.split("/");
      const name = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
      if (builtins.has(name) || declared.has(name)) continue;
      if (!missing.has(name)) missing.set(name, path);
    }
  }
  for (const [name, path] of missing) {
    errors.push(`web/package.json: пакет ${name} не объявлен, а импортируется (${path})`);
  }
}

// Пар *Mobile/*Desktop не становится больше: новые экраны — один адаптивный компонент (ADR-0008).
// Порог только снижается: слил пару — уменьши число здесь.
const DEVICE_SPLIT_LIMIT = { Mobile: 39, Desktop: 33 };

function checkDeviceSplit() {
  const components = repoFiles("web/src").filter(
    (file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"),
  );
  for (const [kind, limit] of Object.entries(DEVICE_SPLIT_LIMIT)) {
    const count = components.filter((file) => basename(file).includes(kind)).length;
    if (count > limit) {
      errors.push(
        `web/src: компонентов *${kind}* — ${count}, порог ${limit}: новый экран делай одним адаптивным компонентом (ADR-0008)`,
      );
    } else if (count < limit) {
      errors.push(`scripts/rules.mjs: компонентов *${kind}* стало ${count} — снизь порог с ${limit} до ${count}`);
    }
  }
}

checkAdr();
checkLinks();
checkWebImports();
checkDeviceSplit();

if (errors.length > 0) {
  console.error(`Правила проекта нарушены (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("== rules: правила проекта соблюдены");
