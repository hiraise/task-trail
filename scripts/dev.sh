#!/usr/bin/env bash
# Проверки TaskTrail (ADR-0009). CI вызывает те же команды, поэтому любой его шаг
# воспроизводится локально: scripts/dev.sh <команда>.
set -euo pipefail

ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
CACHE="$ROOT/.cache"
GOLANGCI_LINT_VERSION=2.15.0

# Стенд (ADR-0010). Сервер на нём — эталон старого API, с которым работает веб-клиент:
# коммит de79e25 из hiraise/tt-backend, после переноса истории — этот.
LEGACY_API_COMMIT=71b514ee41c26b60afb7bbb8b970036b1d591483
STAND="$CACHE/stand"
COMPOSE=(docker compose -f "$ROOT/stand/compose.yaml")

usage() {
	cat <<'EOF'
Использование: scripts/dev.sh <команда>

Проверки (их же запускает CI):
  check   всё сразу: rules, server, web
  rules   правила проекта: ADR, ссылки в документации, зависимости и экраны веба
  server  сервер: go vet, тесты с -race, golangci-lint
  web     веб: линтер, тесты, проверка типов и сборка

Локальный стенд в Docker:
  up              собрать и запустить: веб, сервер, PostgreSQL, перехватчик почты
  smoke           дымовая проверка поднятого стенда: вход через письмо, проект
  down            остановить, данные сохраняются
  reset           остановить и стереть базу
  logs [сервис]   логи: server, web, postgres, mailpit
EOF
}

# Контрольные суммы архивов golangci-lint $GOLANGCI_LINT_VERSION — из файла
# golangci-lint-<версия>-checksums.txt релиза. Меняешь версию — обнови и суммы.
golangci_lint_sha256() {
	case "$1" in
	darwin-amd64) echo 767b899a28285e88ded2823d5dcc4bc5ef681173eb2d80f029a7b17ee4ece3b8 ;;
	darwin-arm64) echo d1e409481a8ca846c4bc97e781eb5cb1bd5c23353a0b3977a1cbda1b1b6447d5 ;;
	linux-amd64) echo 9b7fe6a6bf6334b98decf8d86b11415ea7889afdabdd1959fdce23af2a9ebcea ;;
	linux-arm64) echo b4d8f17068b35ee6060cc2f69a16fb48740d706fbba81661c318649c114a6998 ;;
	*) echo "" ;;
	esac
}

sha256_of() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | cut -d' ' -f1
	else
		shasum -a 256 "$1" | cut -d' ' -f1
	fi
}

# Кладёт в GOLANGCI_LINT путь к golangci-lint закреплённой версии: из PATH, если версия
# совпадает, иначе скачивает релиз в .cache/ и сверяет его с закреплённой суммой.
# Вызывать напрямую, не через $(…): внутри подстановки bash не наследует set -e.
ensure_golangci_lint() {
	if command -v golangci-lint >/dev/null 2>&1 &&
		golangci-lint --version 2>/dev/null | grep -q "version $GOLANGCI_LINT_VERSION "; then
		GOLANGCI_LINT=golangci-lint
		return
	fi
	local dir="$CACHE/golangci-lint-$GOLANGCI_LINT_VERSION"
	GOLANGCI_LINT="$dir/golangci-lint"
	[ -x "$GOLANGCI_LINT" ] && return

	local os arch platform expected name archive actual
	os=$(uname -s | tr '[:upper:]' '[:lower:]')
	case "$(uname -m)" in
	x86_64 | amd64) arch=amd64 ;;
	arm64 | aarch64) arch=arm64 ;;
	*) arch=$(uname -m) ;;
	esac
	platform="$os-$arch"
	expected=$(golangci_lint_sha256 "$platform")
	if [ -z "$expected" ]; then
		echo "golangci-lint: для платформы $platform нет закреплённой суммы — поставь golangci-lint $GOLANGCI_LINT_VERSION в PATH" >&2
		exit 1
	fi
	name="golangci-lint-$GOLANGCI_LINT_VERSION-$platform"
	archive="$dir/$name.tar.gz"
	echo "== golangci-lint $GOLANGCI_LINT_VERSION: скачиваю в $dir"
	mkdir -p "$dir"
	curl -sSfL "https://github.com/golangci/golangci-lint/releases/download/v$GOLANGCI_LINT_VERSION/$name.tar.gz" -o "$archive"
	actual=$(sha256_of "$archive")
	if [ "$expected" != "$actual" ]; then
		rm -f "$archive"
		echo "golangci-lint: контрольная сумма $name.tar.gz не совпала (ожидалась $expected, получена $actual)" >&2
		exit 1
	fi
	tar -xzf "$archive" -C "$dir" --strip-components=1 "$name/golangci-lint"
	rm "$archive"
}

rules() {
	node "$ROOT/scripts/rules.mjs"
}

server() (
	ensure_golangci_lint
	cd "$ROOT/server"
	echo "== server: go vet"
	go vet ./...
	echo "== server: тесты"
	go test -race ./...
	echo "== server: golangci-lint"
	"$GOLANGCI_LINT" run ./...
)

web() (
	cd "$ROOT/web"
	# Зависимости ставятся заново, если package.json или package-lock.json новее установленных
	local installed=node_modules/.package-lock.json
	if [ ! -f "$installed" ] || [ package-lock.json -nt "$installed" ] || [ package.json -nt "$installed" ]; then
		echo "== web: npm ci"
		npm ci --no-audit --no-fund
	fi
	echo "== web: линтер"
	npm run lint
	echo "== web: тесты"
	npm run test:run
	echo "== web: типы и сборка"
	npm run build
)

# Docker нужен стенду. На macOS Docker Desktop запускается сам, если ещё не запущен.
ensure_docker() {
	docker info >/dev/null 2>&1 && return
	if [ "$(uname -s)" = Darwin ] && [ -d /Applications/Docker.app ]; then
		echo "== Docker: запускаю Docker Desktop"
		open -a Docker
		local attempt
		for attempt in $(seq 1 90); do
			docker info >/dev/null 2>&1 && return
			sleep 2
		done
	fi
	echo "Docker не запущен: запусти его и повтори команду" >&2
	exit 1
}

# Исходники эталонного сервера и сертификат почты — в .cache/stand/, их подхватывает stand/compose.yaml
prepare_stand() {
	local legacy="$STAND/legacy"
	if [ "$(cat "$legacy/COMMIT" 2>/dev/null)" != "$LEGACY_API_COMMIT" ]; then
		echo "== стенд: выгружаю сервер ${LEGACY_API_COMMIT:0:7} из истории"
		rm -rf "$legacy"
		mkdir -p "$legacy"
		git -C "$ROOT" archive "$LEGACY_API_COMMIT" server | tar -x -C "$legacy"
		echo "$LEGACY_API_COMMIT" >"$legacy/COMMIT"
	fi
	local certs="$STAND/certs"
	if [ ! -f "$certs/mailpit.crt" ]; then
		echo "== стенд: самоподписанный сертификат для Mailpit"
		mkdir -p "$certs"
		printf '[req]\ndistinguished_name = dn\nx509_extensions = ext\nprompt = no\n[dn]\nCN = mailpit\n[ext]\nsubjectAltName = DNS:mailpit\n' >"$certs/openssl.cnf"
		openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -config "$certs/openssl.cnf" \
			-keyout "$certs/mailpit.key" -out "$certs/mailpit.crt" 2>/dev/null
		chmod 644 "$certs/mailpit.key"
	fi
}

stand_up() {
	ensure_docker
	prepare_stand
	echo "== стенд: сборка и запуск"
	"${COMPOSE[@]}" up -d --build --wait
	cat <<'EOF'
== стенд запущен
  веб      http://localhost:3000   Chrome или Firefox: Safari не принимает Secure-cookies по http
  почта    http://localhost:8025   письма подтверждения почты и сброса пароля
  Swagger  http://localhost:3000/api/docs/index.html   логин и пароль — root
Остановить — scripts/dev.sh down, стереть базу — scripts/dev.sh reset.
EOF
}

case "${1:-}" in
check)
	rules
	server
	web
	echo "== check: всё зелёное"
	;;
rules) rules ;;
server) server ;;
web) web ;;
up) stand_up ;;
smoke) node "$ROOT/scripts/stand-smoke.mjs" ;;
down) "${COMPOSE[@]}" down ;;
reset) "${COMPOSE[@]}" down --volumes ;;
logs)
	shift
	"${COMPOSE[@]}" logs --follow "$@"
	;;
"" | -h | --help | help) usage ;;
*)
	echo "Неизвестная команда: $1" >&2
	usage >&2
	exit 1
	;;
esac
