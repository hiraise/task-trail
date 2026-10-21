#!/usr/bin/env bash
# Проверки TaskTrail (ADR-0009). CI вызывает те же команды, поэтому любой его шаг
# воспроизводится локально: scripts/dev.sh <команда>.
set -euo pipefail

ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
CACHE="$ROOT/.cache"
GOLANGCI_LINT_VERSION=2.15.0

usage() {
	cat <<'EOF'
Использование: scripts/dev.sh <команда>

  check   всё, что проверяет CI: rules, server, web
  rules   правила проекта: ADR, ссылки в документации, зависимости и экраны веба
  server  сервер: go vet, тесты с -race, golangci-lint
  web     веб: линтер, тесты, проверка типов и сборка
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
"" | -h | --help | help) usage ;;
*)
	echo "Неизвестная команда: $1" >&2
	usage >&2
	exit 1
	;;
esac
