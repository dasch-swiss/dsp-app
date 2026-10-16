#!/usr/bin/env bash
# Smoke test of the resource landing-page forwarding in nginx/default.conf.template.
# Builds the real Dockerfile with a stub app shell (no Angular build) and runs it
# against a stub dsp-api upstream on a private Docker network.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_ID="nginx-smoke-$$"
IMAGE="dsp-app-nginx-smoke:$RUN_ID"
NETWORK="$RUN_ID"
WORKDIR="$(mktemp -d)"
FAILURES=0

cleanup() {
  docker rm -f "$RUN_ID-stub" "$RUN_ID-app" "$RUN_ID-dead" "$RUN_ID-empty" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
  docker rmi "$IMAGE" >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

# --- build context: real Dockerfile and nginx/, stub shell ---
mkdir -p "$WORKDIR/context/dist/apps/dsp-app/config" "$WORKDIR/stub"
cp "$REPO_ROOT/Dockerfile" "$WORKDIR/context/"
cp -R "$REPO_ROOT/nginx" "$WORKDIR/context/"
echo '<html><head></head><body>STUB-SHELL</body></html>' >"$WORKDIR/context/dist/apps/dsp-app/index.html"
docker build -q -t "$IMAGE" "$WORKDIR/context" >/dev/null

# --- stub dsp-api: behaviour chosen by the resource id ---
cat >"$WORKDIR/stub/stub.py" <<'PY'
import sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def answer(self, with_body):
        print(f"REQ {self.command} {self.path} cookie={self.headers.get('Cookie')} "
              f"auth={self.headers.get('Authorization')}", file=sys.stderr, flush=True)
        rid = self.path.split("?")[0].rstrip("/").split("/")[-1]
        headers = {"Vary": "Accept", "Cache-Control": "no-store"}
        body = b""
        if rid == "ok200":
            status, body = 200, b"<html><head><meta name=\"DC.title\"></head>LANDING</html>"
            headers["Link"] = '<https://ark.example/1>; rel="cite-as"'
            headers["Content-Type"] = "text/html; charset=UTF-8"
        elif rid == "redir303":
            status = 303
            headers["Location"] = "https://api.example/fair/resources/0803/redir303/metadata.jsonld"
        elif rid == "slow":
            time.sleep(3)
            status = 200
        else:
            status = {"nf404": 404, "na406": 406, "err500": 500}.get(rid, 500)
        self.send_response(status)
        for k, v in headers.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if with_body:
            self.wfile.write(body)

    def do_GET(self):
        self.answer(True)

    def do_HEAD(self):
        self.answer(False)

    def do_POST(self):
        self.answer(True)

ThreadingHTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
PY

docker network create "$NETWORK" >/dev/null
docker run -d --name "$RUN_ID-stub" --network "$NETWORK" --network-alias stub \
  -v "$WORKDIR/stub:/stub:ro" python:3-alpine python -u /stub/stub.py >/dev/null

start_app() { # name upstream
  docker run -d --name "$RUN_ID-$1" --network "$NETWORK" -e "DSP_API_UPSTREAM=$2" \
    -p 127.0.0.1::4200 "$IMAGE" >/dev/null
  docker port "$RUN_ID-$1" 4200 | head -n1 | sed 's/.*://'
}
APP_PORT="$(start_app app http://stub:8000)"
DEAD_PORT="$(start_app dead http://stub:9)"
EMPTY_PORT="$(start_app empty "")"

for port in "$APP_PORT" "$DEAD_PORT" "$EMPTY_PORT"; do
  for _ in $(seq 1 50); do
    curl -fsS -o /dev/null "http://127.0.0.1:$port/" 2>/dev/null && break
    sleep 0.2
  done
done

# --- assertion helpers ---
pass() { echo "ok   - $1"; }
fail() { echo "FAIL - $1"; FAILURES=$((FAILURES + 1)); }

# request PORT METHOD PATH [curl args...] -> sets STATUS, HEADERS, BODY
request() {
  local port="$1" method="$2" path="$3"
  shift 3
  local hfile="$WORKDIR/headers" bfile="$WORKDIR/body"
  local head_flag=()
  [ "$method" = "HEAD" ] && head_flag=(-I)
  STATUS="$(curl -sS -o "$bfile" -D "$hfile" -w '%{http_code}' -X "$method" ${head_flag[@]+"${head_flag[@]}"} "$@" \
    "http://127.0.0.1:$port$path")"
  HEADERS="$(tr -d '\r' <"$hfile")"
  BODY="$(cat "$bfile")"
}
header() { echo "$HEADERS" | grep -i "^$1:" | head -n1 | sed 's/^[^:]*: *//'; }

expect_status() { [ "$STATUS" = "$2" ] && pass "$1: status $2" || fail "$1: status $STATUS, expected $2"; }
expect_header() { [ "$(header "$2")" = "$3" ] && pass "$1: $2: $3" || fail "$1: $2 is '$(header "$2")', expected '$3'"; }
expect_body_has() { echo "$BODY" | grep -q "$2" && pass "$1: body has $2" || fail "$1: body lacks $2"; }
expect_security_headers() {
  [ "$(header X-Frame-Options)" = "DENY" ] && [ "$(header X-Content-Type-Options)" = "nosniff" ] &&
    pass "$1: security headers" || fail "$1: security headers missing"
}
expect_shell() { # name
  expect_status "$1" 200
  expect_body_has "$1" STUB-SHELL
  expect_header "$1" Vary Accept
  expect_header "$1" Cache-Control no-store
  expect_security_headers "$1"
}
stub_saw() { docker logs "$RUN_ID-stub" 2>&1 | grep -q -- "$1"; }

# --- passthroughs ---
request "$APP_PORT" GET "/resource/0803/ok200?version=20240101T000000Z" -H "Cookie: KnoraAuthentication=x" -H "Authorization: Bearer x"
expect_status "200 passthrough" 200
expect_body_has "200 passthrough" LANDING
expect_header "200 passthrough" Link '<https://ark.example/1>; rel="cite-as"'
expect_header "200 passthrough" Vary Accept
expect_security_headers "200 passthrough"
stub_saw "REQ GET /internal/landing-pages/resources/0803/ok200?version=20240101T000000Z cookie=None auth=None" &&
  pass "forwarded path, query kept, credentials cleared" || fail "upstream did not see the expected request"

GET_LINK="$(header Link)"
request "$APP_PORT" HEAD "/resource/0803/ok200"
expect_status "HEAD 200 passthrough" 200
expect_header "HEAD 200 passthrough" Link "$GET_LINK"
expect_header "HEAD 200 passthrough" Vary Accept

request "$APP_PORT" GET "/resource/0803/redir303" -H "Accept: application/ld+json"
expect_status "303 passthrough" 303
expect_header "303 passthrough" Location "https://api.example/fair/resources/0803/redir303/metadata.jsonld"
expect_header "303 passthrough" Vary Accept

request "$APP_PORT" HEAD "/resource/0803/redir303"
expect_status "HEAD 303 passthrough" 303
expect_header "HEAD 303 passthrough" Location "https://api.example/fair/resources/0803/redir303/metadata.jsonld"

# --- fallbacks to the shell ---
for id in nf404 na406 err500 slow; do
  request "$APP_PORT" GET "/resource/0803/$id"
  expect_shell "upstream $id"
done
request "$APP_PORT" HEAD "/resource/0803/err500"
expect_status "HEAD fallback" 200
expect_header "HEAD fallback" Vary Accept
expect_header "HEAD fallback" Cache-Control no-store

request "$DEAD_PORT" GET "/resource/0803/ok200"
expect_shell "no listener"

request "$EMPTY_PORT" GET "/resource/0803/ok200"
expect_shell "empty DSP_API_UPSTREAM"

# --- never forwarded ---
request "$APP_PORT" POST "/resource/0803/posted"
expect_status "POST" 405
stub_saw "/posted" && fail "POST was forwarded" || pass "POST not forwarded"

request "$APP_PORT" GET "/resource/0803/..%2F..%2Ftraversal" --path-as-is
stub_saw "traversal" && fail "traversal path was forwarded" || pass "traversal path not forwarded"

request "$APP_PORT" GET "/resource/0803/abc.json"
stub_saw "abc.json" && fail ".json path was forwarded" || pass ".json path not forwarded"

request "$APP_PORT" GET "/resource/0803/ok200/value123"
stub_saw "value123" && fail "deeper path was forwarded" || pass "deeper path not forwarded"

echo
if [ "$FAILURES" -gt 0 ]; then
  echo "$FAILURES assertion(s) failed"
  exit 1
fi
echo "all assertions passed"
