#!/usr/bin/env bash
# Проверки TaskTrail (ADR-0009). CI вызывает те же команды, поэтому любой его шаг
# воспроизводится локально: scripts/dev.sh <команда>.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
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

sha256_of() {
	if command -v sha256sum >/dev/null 2>&1; then
		sha256sum "$1" | cut -d' ' -f1
	else
		shasum -a 256 "$1" | cut -d' ' -f1
	fi
}

# Кладёт в GOLANGCI_LINT путь к golangci-lint закреплённой версии: из PATH, если версия
# совпадает, иначе скачивает релиз в .cache/ и сверяет контрольную сумму.
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

	local os arch name url archive expected actual
	os=$(uname -s | tr '[:upper:]' '[:lower:]')
	case "$(uname -m)" in
	x86_64 | amd64) arch=amd64 ;;
	arm64 | aarch64) arch=arm64 ;;
	*)
		echo "golangci-lint: неизвестная архитектура $(uname -m)" >&2
		exit 1
		;;
	esac
	name="golangci-lint-$GOLANGCI_LINT_VERSION-$os-$arch"
	url="https://github.com/golangci/golangci-lint/releases/download/v$GOLANGCI_LINT_VERSION"
	archive="$dir/$name.tar.gz"
	echo "== golangci-lint $GOLANGCI_LINT_VERSION: скачиваю в $dir"
	mkdir -p "$dir"
	curl -sSfL "$url/$name.tar.gz" -o "$archive"
	expected=$(curl -sSfL "$url/golangci-lint-$GOLANGCI_LINT_VERSION-checksums.txt" | grep " $name.tar.gz\$" | cut -d' ' -f1)
	actual=$(sha256_of "$archive")
	if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
		rm -f "$archive"
		echo "golangci-lint: контрольная сумма $name.tar.gz не совпала (ожидалась «$expected», получена «$actual»)" >&2
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
	# Зависимости ставятся заново, если package-lock.json новее установленных
	if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
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
