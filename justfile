# dsp-app's task runner: CI runs `nix develop --command just <recipe>`.
#
#   just build [CONFIG | TARGETS...]  the bundle in a configuration (production, development,
#                                     dev-server, ls-test-server, stage-server), or the named
#                                     Bazel targets; no argument builds //...
#   just test [TARGETS...]            every Bazel test target, or the named ones
#   just test-files -- PATHS...       the Jest targets that depend on those files
#   just lint                         ESLint: the Bazel aspect, pnpm for what it does not see
#   just ci                           the gate: build, test, lint, Storybook, the Cypress type-check
#                                     and the version checks
#
# An argument starting with `//` is a target list; anything else is a configuration name. Every
# Bazel call appends $BAZEL_FLAGS, which CI sets to the remote flags plus --lockfile_mode=error,
# except `bazel query`, which runs no action and rejects some of the remote flags; no recipe takes
# Bazel flags positionally.

set shell := ["bash", "-euo", "pipefail", "-c"]

export BAZEL_FLAGS := env("BAZEL_FLAGS", "")

dsp_app_repo := "daschswiss/dsp-app"
build_tag := env("BUILD_TAG", `git describe --tag --match 'v[0-9]*' --dirty --abbrev=7 --always`)
open_api := "libs/vre/3rd-party-services/open-api"
# The dsp-api checkout whose Docker stack the Cypress suite runs against.
dsp_api_dir := env("DSP_API_DIR", "../dsp-api")

# Serves a directory (append `--port <port> <dir>`) with `Cache-Control: no-store`, answering
# unknown paths with its index.html, as a deep link into the app needs.
static_server := "miniserve --interfaces 127.0.0.1 --index index.html --spa --header Cache-Control:no-store --quiet"

# List the recipes
help:
    @just --list --unsorted

# Install the npm dependencies from pnpm-lock.yaml
install:
    pnpm install --frozen-lockfile

# Serve a configuration's bundle on http://localhost:4200, rebuilt on every change (reload to see it)
serve config="production":
    #!/usr/bin/env bash
    set -euo pipefail
    flag="--//apps/dsp-app:config={{ config }}"
    bazel build //apps/dsp-app:dist "$flag" $BAZEL_FLAGS
    ibazel build //apps/dsp-app:dist "$flag" $BAZEL_FLAGS &
    trap 'kill $!' EXIT
    {{ static_server }} --port 4200 "$(bazel info bazel-bin "$flag" $BAZEL_FLAGS 2>/dev/null)/apps/dsp-app/dist"

# Build Storybook and its breakpoint-stories variant; a story's type error fails here
storybook-build:
    bazel build //:storybook //:storybook_breakpoints $BAZEL_FLAGS

# Serve the Bazel-built Storybook on http://localhost:4400, rebuilding on every source change
storybook:
    #!/usr/bin/env bash
    set -euo pipefail
    bazel build //:storybook $BAZEL_FLAGS
    ibazel build //:storybook $BAZEL_FLAGS &
    trap 'kill $!' EXIT
    {{ static_server }} --port 4400 "$(bazel info bazel-bin $BAZEL_FLAGS 2>/dev/null)/storybook"

# Run the interaction tests against the Bazel-built Storybook with the dev shell's browsers
storybook-test: install
    #!/usr/bin/env bash
    set -euo pipefail
    bazel build //:storybook $BAZEL_FLAGS
    ! curl -s -o /dev/null http://127.0.0.1:6006/ || { echo "port 6006 is already serving; stop that server first" >&2; exit 1; }
    {{ static_server }} --port 6006 "$(bazel info bazel-bin $BAZEL_FLAGS 2>/dev/null)/storybook" &
    trap 'kill $!' EXIT
    timeout 60 bash -c 'until curl -sf -o /dev/null http://127.0.0.1:6006/index.json; do sleep 0.5; done'
    # Keep two workers: in band the runner runs out of heap, with four it hits ChunkLoadError.
    pnpm exec test-storybook -c .storybook --url=http://127.0.0.1:6006 --index-json --ci --maxWorkers=2

# Build the bundle in a configuration (bazel-bin/apps/dsp-app/dist), the named Bazel targets, or //...
build *ARGS:
    #!/usr/bin/env bash
    set -euo pipefail
    args=({{ ARGS }})
    if [ "${#args[@]}" -gt 0 ] && [[ "${args[0]}" != //* ]]; then
      [ "${#args[@]}" -eq 1 ] || { echo "just build: one configuration, or Bazel targets" >&2; exit 1; }
      exec bazel build //apps/dsp-app:dist "--//apps/dsp-app:config=${args[0]}" $BAZEL_FLAGS
    fi
    bazel build "${args[@]:-//...}" $BAZEL_FLAGS

# Run the named Bazel test targets, or every test target
test *TARGETS:
    bazel test {{ if TARGETS == "" { "//..." } else { TARGETS } }} $BAZEL_FLAGS

# Run the Jest targets that depend on the given repository paths (`just test-files -- <paths>`)
[positional-arguments]
test-files *FILES:
    #!/usr/bin/env bash
    set -euo pipefail
    [ "${1:-}" != "--" ] || shift
    [ "$#" -gt 0 ] || { echo "just test-files: no paths given" >&2; exit 1; }
    labels=()
    everything=0
    for path in "$@"; do
      # GNU realpath, from the dev shell.
      file="$(realpath -m --relative-to=. "$path")"
      case "$file" in
        .. | ../* | /*) echo "just test-files: $path is outside the repository" >&2; exit 1 ;;
        # No target depends on these, but they change what the targets are: run every test.
        *.bzl | MODULE.bazel* | .bazelrc | .bazelversion | pnpm-lock.yaml | package.json)
          everything=1; continue ;;
      esac
      dir="$(dirname "$file")"
      while [ "$dir" != "." ] && [ ! -f "$dir/BUILD.bazel" ]; do dir="$(dirname "$dir")"; done
      pkg="$([ "$dir" = "." ] || echo "$dir")"
      if [ "$(basename "$file")" = "BUILD.bazel" ]; then
        labels+=("//$pkg:*")
      else
        labels+=("//$pkg:${file#"$pkg/"}")
      fi
    done
    [ "$everything" -eq 0 ] || exec bazel test //... $BAZEL_FLAGS
    # A path no rule reads (a README, a deleted file) is no target; --keep_going skips it and exits
    # 3. Any other error, a package that fails to load included, fails the recipe.
    errors="$(mktemp)"
    trap 'rm -f "$errors"' EXIT
    status=0
    targets="$(bazel query --keep_going "kind(jest_test, rdeps(//..., set(${labels[*]})))" 2>"$errors")" || status=$?
    if [ "$status" -ne 0 ] && { [ "$status" -ne 3 ] || awk '/^ERROR:/ && !/^ERROR: Skipping .*: no such target/ { found = 1 } END { exit !found }' "$errors"; }; then
      cat "$errors" >&2
      echo "just test-files: bazel query failed with exit code $status" >&2
      exit 1
    fi
    if [ -z "$targets" ]; then
      echo "just test-files: no Jest target depends on $*"
      exit 0
    fi
    bazel test $targets $BAZEL_FLAGS

# ESLint, each file under its nearest eslint.config.mjs: the Bazel aspect over every ts_project's
# sources, pnpm over the files the aspect does not see
lint: install openapi-generate
    #!/usr/bin/env bash
    set -euo pipefail
    # Both halves run, so one call reports every finding.
    status=0
    bazel build --config=lint //... $BAZEL_FLAGS || status=1
    # The aspect lints only a ts_project's `srcs`; specs, stories, templates, JavaScript configs,
    # libs/dsp-js/test and apps/dsp-app stay with pnpm until a Bazel target carries them.
    linted="$(bazel query 'labels(srcs, kind(ts_project, //...))' | sed -E 's|^//:?||; s|:|/|')"
    patterns=()
    for dir in $(git ls-files '*/eslint.config.mjs' | xargs -n1 dirname); do
      patterns+=("$dir/*.ts" "$dir/*.js" "$dir/*.mjs" "$dir/*.cjs" "$dir/*.html")
    done
    # Untracked files are linted too; a tracked file deleted from the working tree is skipped.
    git ls-files --cached --others --exclude-standard -- "${patterns[@]}" \
      | { grep -vxFf <(printf '%s\n' "$linted") || true; } \
      | while read -r file; do [ ! -f "$file" ] || echo "$file"; done \
      | xargs -r pnpm exec eslint --flag v10_config_lookup_from_file --no-warn-ignored || status=1
    exit "$status"

# Check that `just lint` fails on a seeded violation with the rule id ESLint through pnpm reports
lint-selftest:
    #!/usr/bin/env bash
    set -euo pipefail
    seed=libs/dsp-js/src/lint-seed.ts
    trap 'rm -f "$seed"' EXIT
    printf 'const unusedLocal = 1;\nexport {};\n' >"$seed"
    if output="$(just lint 2>&1)"; then
      echo "lint-selftest: just lint passed on $seed, which it must reject" >&2
      exit 1
    fi
    if ! grep -q "lint-seed.ts" <<<"$output"; then
      echo "$output" >&2
      echo "lint-selftest: just lint failed, but not on $seed" >&2
      exit 1
    fi
    report="$(pnpm exec eslint --flag v10_config_lookup_from_file --format json "$seed" || true)"
    rules="$(node -e 'for (const m of JSON.parse(process.argv[1])[0].messages) console.log(m.ruleId)' "$report")"
    if [ -z "$rules" ]; then
      echo "lint-selftest: ESLint through pnpm reported nothing on $seed" >&2
      exit 1
    fi
    for rule in $rules; do
      if ! grep -qF "$rule" <<<"$output"; then
        echo "$output" >&2
        echo "lint-selftest: ESLint through pnpm reports $rule on $seed, just lint does not" >&2
        exit 1
      fi
    done
    echo "lint-selftest: just lint rejected the seeded violation with" $rules

# The gate CI runs
ci: build test lint node-version-check playwright-version-check tsconfig-paths-check storybook-build typecheck-e2e

# Type-check the Cypress suite, its own project (ADR-0006); its specs import the generated client
typecheck-e2e: install openapi-generate
    pnpm exec tsc --noEmit -p apps/dsp-app/cypress/tsconfig.json

# Start the dsp-api stack Cypress runs against from DSP_API_DIR: a fresh test database, sipi, ingest, API
e2e-stack-up:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{ dsp_api_dir }}"
    just init-db-test
    docker compose -f docker-compose.yml up -d sipi ingest api
    ./modules/webapi/scripts/wait-for-api.sh

# Stop the dsp-api stack
e2e-stack-down:
    cd "{{ dsp_api_dir }}" && docker compose -f docker-compose.yml down

# Spec paths are relative to apps/dsp-app, as Cypress takes them. Chrome where CHROME_BIN is set
# (devShells.e2e on Linux), Cypress's Electron otherwise.
# Run Cypress specs against the production bundle on port 4200 (`just e2e-stack-up` first)
e2e +specs: install openapi-generate
    #!/usr/bin/env bash
    set -euo pipefail
    bazel build //apps/dsp-app:dist $BAZEL_FLAGS
    ! curl -s -o /dev/null http://127.0.0.1:4200/ || { echo "port 4200 is already serving; stop that server first" >&2; exit 1; }
    {{ static_server }} --port 4200 "$(bazel info bazel-bin $BAZEL_FLAGS 2>/dev/null)/apps/dsp-app/dist" &
    trap 'kill $!' EXIT
    timeout 60 bash -c 'until curl -sf -o /dev/null http://127.0.0.1:4200/; do sleep 0.5; done'
    browser=electron
    [ -z "${CHROME_BIN:-}" ] || browser="$CHROME_BIN"
    specs=({{ specs }})
    cd apps/dsp-app
    pnpm exec cypress run --browser "$browser" --spec "$(IFS=,; echo "${specs[*]}")"

# Generate the OpenAPI client with Bazel and copy it to src/generated for the IDE
openapi-generate:
    #!/usr/bin/env bash
    set -euo pipefail
    # A spec change can add or remove generated files, so refresh the manifest the action declares.
    bazel build //{{ open_api }}:generated_tree $BAZEL_FLAGS
    bin="$(bazel info bazel-bin $BAZEL_FLAGS 2>/dev/null)"
    tools/openapi/write_manifest.sh "$bin/{{ open_api }}/generated_tree"
    # After the manifest: :generated declares its outputs from it.
    bazel build //{{ open_api }}:generated $BAZEL_FLAGS
    rm -rf {{ open_api }}/src/generated
    # Not :generated's directory, which also holds the library's compiled output.
    cp -R "$bin/{{ open_api }}/generated_tree" {{ open_api }}/src/generated
    chmod -R u+w {{ open_api }}/src/generated

# Compare the vendored dsp-api spec with the dev API's (`--verbose` shows the differences)
openapi-check *ARGS:
    ./scripts/check-openapi-sync.sh {{ ARGS }}

# Download the dev API's spec and regenerate the client
openapi-update:
    curl -fsSL -o {{ open_api }}/dsp-api_spec.yaml https://api.dev.dasch.swiss/api/docs/docs.yaml
    just openapi-generate

# Fail when the dev shell's Node and Bazel's Node differ in major version
node-version-check:
    #!/usr/bin/env bash
    set -euo pipefail
    bazel_node="$(sed -n 's/^node.toolchain(node_version = "\([0-9.]*\)")$/\1/p' MODULE.bazel)"
    shell_node="$(node --version | sed 's/^v//')"
    [ -n "$bazel_node" ] || { echo "no node.toolchain(node_version = ...) line in MODULE.bazel" >&2; exit 1; }
    if [ "${bazel_node%%.*}" != "${shell_node%%.*}" ]; then
      echo "Node majors differ: MODULE.bazel pins $bazel_node, the dev shell has $shell_node" >&2
      exit 1
    fi
    echo "Node $bazel_node (Bazel) and $shell_node (dev shell)"

# Fail when package.json's Playwright pin and the dev shell's playwright-driver differ
playwright-version-check:
    #!/usr/bin/env bash
    set -euo pipefail
    driver="$(nix eval --raw --inputs-from . nixpkgs#playwright-driver.version)"
    # @pixeleye/cli-install>playwright-core is held at 1.59.0 on purpose and not compared.
    for pkg in playwright playwright-core; do
      pin="$(node -p "require('./package.json').pnpm.overrides['$pkg']")"
      if [ "$pin" != "$driver" ]; then
        echo "package.json pins $pkg $pin, the dev shell's playwright-driver is $driver" >&2
        exit 1
      fi
    done
    echo "playwright $driver"

# Fail when a tsconfig.base.json alias has no Bazel package
tsconfig-paths-check:
    #!/usr/bin/env bash
    set -euo pipefail
    missing=0
    while read -r alias target; do
      dir="${target%/src/*}"
      if [ ! -f "$dir/BUILD.bazel" ]; then
        echo "$alias maps to $target, but $dir has no BUILD.bazel" >&2
        missing=1
      fi
    done < <(node -e 'const p = require("./tsconfig.base.json").compilerOptions.paths; for (const [a, [t]] of Object.entries(p)) console.log(a, t)')
    exit "$missing"

# Refresh MODULE.bazel.lock and pnpm-lock.yaml
lock-update:
    bazel mod deps --lockfile_mode=update
    pnpm install --lockfile-only

# Inject and upload Sentry source maps for a copy of a built bundle (needs SENTRY_AUTH_TOKEN)
sentry-sourcemaps DIST:
    #!/usr/bin/env bash
    set -euo pipefail
    : "${SENTRY_AUTH_TOKEN:?SENTRY_AUTH_TOKEN is not set}"
    copy="$(mktemp -d)"
    trap 'rm -rf "$copy"' EXIT
    cp -R "{{ DIST }}/." "$copy"
    pnpm exec sentry-cli sourcemaps inject --org dasch --project javascript-angular "$copy"
    pnpm exec sentry-cli sourcemaps upload --org dasch --project javascript-angular "$copy"

# Compare the dsp-js npm package with the last published @dasch-swiss/dsp-js
publish-dsp-js-check:
    bazel build //libs/dsp-js:npm_package $BAZEL_FLAGS
    ./scripts/publish-dsp-js-check.sh "$(bazel info bazel-bin $BAZEL_FLAGS 2>/dev/null)/libs/dsp-js/npm_package"

# List focused or skipped tests (fdescribe, fit, .only, xit, .skip)
find-ignored-tests:
    @git grep -n -E '(^|[^[:alnum:]_.])((fdescribe|fit|xdescribe|xit)|(describe|it|test)\.(only|skip))\(' -- '*.spec.ts' '*.cy.ts' || echo "no focused or skipped tests"

# Build the docs into site/
docs-build:
    mkdocs build --strict

# Serve the docs for local viewing
docs-serve:
    mkdocs serve --strict

# Lint the docs with markdownlint
docs-lint:
    markdownlint --config .markdownlint.json -i docs/contribution/release-notes.md -i docs/index.md --disable MD033 -- "docs/**/*.md"

# Remove the built docs
docs-clean:
    rm -rf site/

# Load the image for an architecture (amd64, arm64; the host's by default) as :latest and :<build tag>
docker-build-app arch="":
    bazel run $BAZEL_FLAGS //apps/dsp-app/image:load{{ if arch == "" { "" } else { "_" + arch } }}
    docker tag {{ dsp_app_repo }}:latest "{{ dsp_app_repo }}:{{ build_tag }}"

# crane and oci_push read the registry login from ~/.docker/config.json.
# Publish the stamped multi-arch image as :<build tag> and :latest
docker-publish-app repository=("index.docker.io/" + dsp_app_repo):
    #!/usr/bin/env bash
    set -euo pipefail
    repo="{{ repository }}"
    tag="{{ build_tag }}"
    for arch in amd64 arm64; do
      bazel run --stamp $BAZEL_FLAGS "//apps/dsp-app/image:push_$arch" -- --repository "$repo" --tag "$tag-$arch"
    done
    crane index append -m "$repo:$tag-amd64" -m "$repo:$tag-arm64" -t "$repo:$tag"
    crane tag "$repo:$tag" latest

# Push a stamped amd64 image of a configuration's bundle and print its digest last (Cloud Run preview)
docker-push-preview repository tag config:
    bazel run --stamp $BAZEL_FLAGS "--//apps/dsp-app:config={{ config }}" //apps/dsp-app/image:push_amd64 -- --repository "{{ repository }}" --tag "{{ tag }}"
    crane digest "{{ repository }}:{{ tag }}"

# Publish every image in the repository
docker-publish: docker-publish-app

# Print the image tag
docker-image-tag:
    @echo {{ build_tag }}

# Test the image: bundle served, landing pages forwarded to a stub dsp-api, compose healthcheck inside
nginx-smoke-test: docker-build-app
    ./scripts/nginx-smoke-test.sh
