#!/usr/bin/env bash
# TaskTrail checks (ADR-0009). CI runs the same commands, so any of its steps
# can be reproduced locally: scripts/dev.sh <command>.
set -euo pipefail

ROOT=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
CACHE="$ROOT/.cache"
GOLANGCI_LINT_VERSION=2.15.0
# Playwright for screenshots of the local stack (ADR-0040): a tool for agents, not a web dependency
PLAYWRIGHT_VERSION=1.56.1

# Release images (ADR-0042): GitHub Container Registry, one repository per image
IMAGE_PREFIX=ghcr.io/hiraise/task-trail

# Local stack (ADR-0010): server from server/, web from web/, PostgreSQL and a mail catcher
COMPOSE=(docker compose -f "$ROOT/stand/compose.yaml")

usage() {
	cat <<'EOF'
Usage: scripts/dev.sh <command>

Checks (CI runs the same):
  check   everything: rules, server, web
  rules   project rules: ADRs, links in docs, web dependencies and screens
  server  server: go vet, tests with -race (PostgreSQL in Docker, responses checked against the contract), golangci-lint
  web     web: API types from the contract, linter, tests, type check and build

Local stack in Docker:
  up              build and start: web, server, PostgreSQL, mail catcher;
                  on an empty database, create the administrator and set up mail
  smoke           smoke test of the running stack: sign-in, invitation by email,
                  task, avatar
  down            stop, data is kept
  reset           stop and wipe the database and files
  logs [service]  logs: server, web, postgres, mailpit
  screens <dir> <path>... [--widths 393,768,1200] [--click <selector>]...
                  full-page screenshots of the running stack, signed in as the administrator

Release (ADR-0042):
  images <version> [--push]
                  build the server and web images tagged <version> (e.g. 1.0.0) and, for the newest
                  release, latest; with --push, upload them to GitHub Container Registry (CI does it
                  when a release PR is merged)

Branches and CI (ADR-0043):
  ci [<pr>|<branch>]
                  wait for CI of a PR (default: the PR of the current branch) or of the last commit
                  on a branch (main, release/X.Y.Z); print one line per check and, on failure,
                  the tail of the failed log
  pr-base <base> <head>
                  fail if a PR into main does not come from a release/X.Y.Z branch (CI runs it)
  cleanup         remove worktrees and branches whose PRs are merged
EOF
}

# Checksums of the golangci-lint $GOLANGCI_LINT_VERSION archives, from the release file
# golangci-lint-<version>-checksums.txt. When you change the version, update the checksums too.
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

# Sets GOLANGCI_LINT to the path of golangci-lint of the pinned version: from PATH if the version
# matches, otherwise downloads the release into .cache/ and verifies it against the pinned checksum.
# Call it directly, not via $(…): bash does not inherit set -e inside a command substitution.
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
		echo "golangci-lint: no pinned checksum for platform $platform; install golangci-lint $GOLANGCI_LINT_VERSION into PATH" >&2
		exit 1
	fi
	name="golangci-lint-$GOLANGCI_LINT_VERSION-$platform"
	archive="$dir/$name.tar.gz"
	echo "== golangci-lint $GOLANGCI_LINT_VERSION: downloading into $dir"
	mkdir -p "$dir"
	curl -sSfL "https://github.com/golangci/golangci-lint/releases/download/v$GOLANGCI_LINT_VERSION/$name.tar.gz" -o "$archive"
	actual=$(sha256_of "$archive")
	if [ "$expected" != "$actual" ]; then
		rm -f "$archive"
		echo "golangci-lint: checksum of $name.tar.gz does not match (expected $expected, got $actual)" >&2
		exit 1
	fi
	tar -xzf "$archive" -C "$dir" --strip-components=1 "$name/golangci-lint"
	rm "$archive"
}

rules() {
	node "$ROOT/scripts/rules.mjs"
}

# Temporary PostgreSQL for repository integration tests (ADR-0007): the same image as the
# local stack, on a random port; the container is removed when the calling function exits.
# The address goes to TEST_PG_URL, read by server/test/testdb.
start_test_postgres() {
	ensure_docker
	local image name port attempt
	image=$(sed -n 's/^ *image: *\(postgres:[^ ]*\).*/\1/p' "$ROOT/stand/compose.yaml" | head -1)
	name="tasktrail-test-pg-$$"
	echo "== server: temporary $image for integration tests"
	docker run -d --rm --name "$name" -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test \
		-p 127.0.0.1::5432 "$image" >/dev/null
	trap "docker rm -f '$name' >/dev/null 2>&1" EXIT
	# Ready only when it listens on TCP: during initialization the server is reachable only via the socket
	for attempt in $(seq 1 60); do
		docker exec "$name" pg_isready -q -h 127.0.0.1 -U test -d test && break
		sleep 1
	done
	port=$(docker port "$name" 5432/tcp | head -1 | sed 's/.*://')
	export TEST_PG_URL="postgresql://test:test@127.0.0.1:$port/test"
}

server() (
	ensure_golangci_lint
	start_test_postgres
	cd "$ROOT/server"
	echo "== server: go vet"
	go vet ./...
	echo "== server: tests"
	go test -race ./...
	echo "== server: golangci-lint"
	"$GOLANGCI_LINT" run ./...
)

# Web dependencies are reinstalled if package.json or package-lock.json is newer than the installed ones
ensure_web_deps() (
	cd "$ROOT/web"
	local installed=node_modules/.package-lock.json
	if [ ! -f "$installed" ] || [ package-lock.json -nt "$installed" ] || [ package.json -nt "$installed" ]; then
		echo "== web: npm ci"
		npm ci --no-audit --no-fund
	fi
)

web() (
	ensure_web_deps
	cd "$ROOT/web"
	echo "== web: API types match the contract (ADR-0020)"
	local generated=src/infrastructure/api/generated fresh
	fresh=$(mktemp -d)
	trap 'rm -rf "$fresh"' EXIT
	API_TYPES_OUT="$fresh" npm run --silent api:types
	if ! diff -r "$fresh" "$generated"; then
		echo "Types in web/$generated are outdated: run npm run api:types in web/ and commit the result" >&2
		exit 1
	fi
	echo "== web: linter"
	npm run lint
	echo "== web: tests"
	npm run test:run
	echo "== web: types and build"
	npm run build
)

# The local stack needs Docker. On macOS, Docker Desktop is started automatically if it is not running.
ensure_docker() {
	if ! command -v docker >/dev/null 2>&1; then
		echo "No docker command: install Docker and run the command again" >&2
		exit 1
	fi
	docker info >/dev/null 2>&1 && return
	if [ "$(uname -s)" = Darwin ] && [ -d /Applications/Docker.app ]; then
		echo "== Docker: starting Docker Desktop"
		open -a Docker
		local attempt
		for attempt in $(seq 1 90); do
			docker info >/dev/null 2>&1 && return
			sleep 2
		done
	fi
	echo "Docker is unavailable:" >&2
	docker info 2>&1 >/dev/null | head -3 >&2 || true
	exit 1
}

# Release images are built from the same Dockerfiles as the local stack, for the platform of the machine:
# CI runs on linux/amd64, so released images are linux/amd64. latest is the newest release: a patch of
# an older line (1.1.5 after 1.2.0) gets only its own tag
images() {
	local version=${1:-} push=${2:-}
	if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { [ -n "$push" ] && [ "$push" != --push ]; }; then
		echo "Usage: scripts/dev.sh images <version, e.g. 1.0.0> [--push]" >&2
		exit 2
	fi
	ensure_docker
	local tags=("$version") newest
	newest=$( (git -C "$ROOT" tag -l 'v[0-9]*.[0-9]*.[0-9]*' | sed 's/^v//'; echo "$version") | sort -V | tail -1)
	[ "$newest" = "$version" ] && tags+=(latest)
	local labels=(--label "org.opencontainers.image.source=https://github.com/hiraise/task-trail"
		--label "org.opencontainers.image.version=$version" --label "org.opencontainers.image.licenses=MIT")
	for image in server web; do
		local args=()
		for tag in "${tags[@]}"; do args+=(-t "$IMAGE_PREFIX-$image:$tag"); done
		echo "== images: $image ${tags[*]}"
		if [ "$image" = server ]; then
			docker build "${labels[@]}" "${args[@]}" -f "$ROOT/server/docker/Dockerfile" "$ROOT"
		else
			docker build "${labels[@]}" "${args[@]}" -f "$ROOT/web/docker/Dockerfile" "$ROOT/web"
		fi
		if [ "$push" = --push ]; then
			for tag in "${tags[@]}"; do docker push "$IMAGE_PREFIX-$image:$tag"; done
		fi
	done
	echo "== images: done"
}

# The first account and mail are set up via the admin API, not the server environment (ADR-0015):
# scripts/stand-setup.mjs, which also prints the addresses and sign-in
stand_up() {
	ensure_docker
	echo "== stack: build and start"
	"${COMPOSE[@]}" up -d --build --wait
	node "$ROOT/scripts/stand-setup.mjs"
}

# Sets PLAYWRIGHT_DIR to Playwright $PLAYWRIGHT_VERSION installed into .cache/, with its headless Chromium.
# Call it directly, not via $(…), like ensure_golangci_lint.
ensure_playwright() {
	PLAYWRIGHT_DIR="$CACHE/playwright-$PLAYWRIGHT_VERSION"
	if [ ! -d "$PLAYWRIGHT_DIR/node_modules/playwright" ]; then
		echo "== playwright $PLAYWRIGHT_VERSION: installing into $PLAYWRIGHT_DIR"
		mkdir -p "$PLAYWRIGHT_DIR"
		echo '{ "private": true }' >"$PLAYWRIGHT_DIR/package.json"
		npm install --prefix "$PLAYWRIGHT_DIR" --no-audit --no-fund --silent "playwright@$PLAYWRIGHT_VERSION"
	fi
	# Downloads the browser only if this Playwright version has none in its cache yet
	"$PLAYWRIGHT_DIR/node_modules/.bin/playwright" install --only-shell chromium >/dev/null
}

screens() {
	ensure_playwright
	PLAYWRIGHT_DIR="$PLAYWRIGHT_DIR" node "$ROOT/scripts/screens.mjs" "$@"
}

require_gh() {
	if ! command -v gh >/dev/null 2>&1; then
		echo "GitHub CLI (gh) is required" >&2
		exit 1
	fi
}

# For each failed job of a workflow run: 40 log lines before the first error, without timestamps —
# enough to see which step failed and why. The job log comes from the API: gh run view --log-failed
# prints nothing in some gh versions.
ci_failed_log() {
	local job
	for job in $(gh run view "$1" --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .databaseId'); do
		echo "== failed job $job of run $1 (full log: gh api repos/{owner}/{repo}/actions/jobs/$job/logs)"
		gh api "repos/{owner}/{repo}/actions/jobs/$job/logs" 2>&1 |
			sed -E 's/^[0-9T:.-]+Z //' |
			awk '/^##\[error\]/ { for (i = n - 40; i < n; i++) if (i >= 0) print buf[i % 40]; print; exit }
				{ buf[n++ % 40] = $0 }' || true
	done
}

# Waits for CI and prints a short result instead of the refreshing gh tables (ADR-0040): an agent runs
# it in the background and gets one notification. Exit status 0 — all checks passed.
ci() (
	require_gh
	cd "$ROOT"
	local target=${1:-} attempt names run sha conclusion failed
	if [ -z "$target" ]; then
		target=$(gh pr view --json number --jq .number 2>/dev/null) ||
			{ echo "No PR for the current branch: pass a PR number or a branch" >&2; exit 1; }
	fi
	if ! [[ "$target" =~ ^[0-9]+$ ]]; then
		git fetch -q origin "$target"
		sha=$(git rev-parse "origin/$target")
		# The run of a fresh merge commit appears a few seconds after the merge
		for attempt in $(seq 1 24); do
			run=$(gh run list --workflow ci.yml --branch "$target" --limit 5 --json databaseId,headSha \
				--jq ".[] | select(.headSha == \"$sha\") | .databaseId" | head -1)
			[ -n "$run" ] && break
			sleep 5
		done
		if [ -z "$run" ]; then
			echo "$target ${sha:0:7}: no CI run after 2 minutes" >&2
			exit 1
		fi
		gh run watch "$run" --exit-status --interval 20 >/dev/null 2>&1 || true
		conclusion=$(gh run view "$run" --json conclusion --jq .conclusion)
		echo "$target ${sha:0:7}: $conclusion (run $run)"
		[ "$conclusion" = success ] && exit 0
		ci_failed_log "$run"
		exit 1
	fi
	# GitHub registers checks a few seconds after a push; none after two minutes means CI did not start
	for attempt in $(seq 1 24); do
		names=$(gh pr checks "$target" --json name --jq '.[].name' 2>/dev/null || true)
		[ -n "$names" ] && break
		sleep 5
	done
	if [ -z "$names" ]; then
		echo "PR #${target}: no checks after 2 minutes, GitHub did not start CI: gh pr close $target && gh pr reopen $target" >&2
		exit 1
	fi
	gh pr checks "$target" --watch --interval 20 >/dev/null 2>&1 || true
	gh pr checks "$target" --json bucket,name --jq '.[] | .bucket + "\t" + .name' 2>/dev/null |
		while IFS=$'\t' read -r bucket name; do echo "PR #${target}: $name — $bucket"; done || true
	failed=$(gh pr checks "$target" --json bucket,link \
		--jq '.[] | select(.bucket != "pass" and .bucket != "skipping") | .link' 2>/dev/null |
		sed -n 's#.*/actions/runs/\([0-9]*\).*#\1#p' | sort -u || true)
	[ -z "$failed" ] && exit 0
	for run in $failed; do
		ci_failed_log "$run"
	done
	exit 1
)

# main holds only released code (ADR-0043): a PR into it comes only from a release branch.
pr_base() {
	local base=${1:-} head=${2:-}
	if [ "$base" != main ] || [[ "$head" =~ ^release/[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
		echo "== pr-base: ${head:-?} -> ${base:-?} ok"
		return
	fi
	echo "A PR into main comes only from release/X.Y.Z, not from ${head} (ADR-0043): retarget it with gh pr edit <N> --base release/X.Y.Z" >&2
	exit 1
}

# Removes worktrees of branches whose PR is merged (CLAUDE.md, "Branches and PRs"): the sources stay in git history.
# A branch is merged if its last commit is the last commit of a merged PR; this also detects a merge
# without a merge commit. Leaves alone the main folder, the current worktree and folders with uncommitted
# changes. Use ${var} before non-ASCII text: otherwise bash 3.2 in the C locale takes its bytes into the variable name.
cleanup() (
	require_gh
	cd "$ROOT"
	git fetch -q --prune origin
	local main_tree here tree branch head pr removed=0
	main_tree=$(git worktree list --porcelain | sed -n '1s/^worktree //p')
	here=$(git rev-parse --show-toplevel)
	while IFS=$'\t' read -r tree branch; do
		if [ "$tree" = "$main_tree" ] || [ "$tree" = "$here" ]; then
			continue
		fi
		head=$(git rev-parse "refs/heads/$branch")
		pr=$(gh pr list --state merged --head "$branch" --json number,headRefOid \
			--jq ".[] | select(.headRefOid == \"$head\") | .number" | head -1)
		[ -n "$pr" ] || continue
		if [ -n "$(git -C "$tree" status --porcelain)" ]; then
			echo "Kept ${tree}: it has uncommitted changes" >&2
			continue
		fi
		if ! git worktree remove "$tree"; then
			echo "Failed to remove ${tree}" >&2
			continue
		fi
		git branch -q -D "$branch"
		echo "Removed $tree and branch ${branch} (PR #${pr})"
		removed=$((removed + 1))
	done < <(git worktree list --porcelain |
		awk '/^worktree /{tree=substr($0, 10)} /^branch refs\/heads\//{print tree "\t" substr($0, 19)}')
	git worktree prune
	echo "== cleanup: worktrees removed: $removed"
)

case "${1:-}" in
check)
	rules
	server
	web
	echo "== check: all green"
	;;
rules) rules ;;
server) server ;;
web) web ;;
images)
	shift
	images "$@"
	;;
up) stand_up ;;
smoke) node "$ROOT/scripts/stand-smoke.mjs" ;;
down) "${COMPOSE[@]}" down ;;
reset) "${COMPOSE[@]}" down --volumes ;;
logs)
	shift
	# In a terminal, follow the logs; in a script or for an agent, print the last 200 lines and exit
	if [ -t 1 ]; then
		"${COMPOSE[@]}" logs --follow --tail=200 "$@"
	else
		"${COMPOSE[@]}" logs --tail=200 "$@"
	fi
	;;
screens)
	shift
	screens "$@"
	;;
ci)
	shift
	ci "$@"
	;;
pr-base)
	shift
	pr_base "$@"
	;;
cleanup) cleanup ;;
"" | -h | --help | help) usage ;;
*)
	echo "Unknown command: $1" >&2
	usage >&2
	exit 1
	;;
esac
