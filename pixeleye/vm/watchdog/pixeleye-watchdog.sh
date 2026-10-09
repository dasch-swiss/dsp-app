#!/usr/bin/env bash
# Restarts pixeleye-backend when its DB connection pool is wedged.
#
# Failure mode (DEV-7238): concurrent snapshot ingestion hits `lock_timeout`, the
# backend never rolls back the failed transactions, and all DB_MAX_CONNECTIONS pool
# slots stay bound to dead transactions. The container stays "Up" but every request
# that touches the DB hangs forever. Only a restart recovers it.
#
# The probe must touch the DB: unauthenticated requests are rejected before any query
# and keep answering in microseconds while the backend is wedged. An authenticated
# `latestBuilds` call verifies the project token against Postgres, so it hangs exactly
# when the pool does.
#
# Run by pixeleye-watchdog.timer. Logs go to journald: `journalctl -u pixeleye-watchdog`.
set -uo pipefail

ENV_FILE=/etc/pixeleye-watchdog.env
COMPOSE_DIR=/opt/pixeleye/vm
STATE_DIR=/run/pixeleye-watchdog
PROBE_TIMEOUT=10
FAILURE_THRESHOLD=2
RESTART_COOLDOWN=600

# shellcheck source=/dev/null
source "$ENV_FILE"
: "${PIXELEYE_TOKEN:?PIXELEYE_TOKEN missing in $ENV_FILE}"
: "${PIXELEYE_ENDPOINT:?PIXELEYE_ENDPOINT missing in $ENV_FILE}"

mkdir -p "$STATE_DIR"
failures=$(cat "$STATE_DIR/failures" 2>/dev/null || echo 0)
last_restart=$(cat "$STATE_DIR/last_restart" 2>/dev/null || echo 0)

code=$(curl -sS -o /dev/null -w '%{http_code}' -m "$PROBE_TIMEOUT" \
  -X POST "${PIXELEYE_ENDPOINT}/v1/client/latestBuilds" \
  -H "Authorization: Bearer ${PIXELEYE_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"shas":["pixeleye-watchdog"]}' 2>/dev/null)

case "$code" in
  200)
    [ "$failures" -gt 0 ] && echo "probe recovered after ${failures} failure(s)"
    echo 0 > "$STATE_DIR/failures"
    exit 0
    ;;
  401|403)
    # A restart cannot fix a bad token; restarting on it would loop forever.
    echo "probe rejected with HTTP ${code}: PIXELEYE_TOKEN in ${ENV_FILE} is invalid" >&2
    exit 1
    ;;
esac

failures=$((failures + 1))
echo "$failures" > "$STATE_DIR/failures"
echo "probe failed (HTTP ${code}, 000 = timeout/unreachable), consecutive failures: ${failures}/${FAILURE_THRESHOLD}" >&2
[ "$failures" -lt "$FAILURE_THRESHOLD" ] && exit 0

now=$(date +%s)
if [ $((now - last_restart)) -lt "$RESTART_COOLDOWN" ]; then
  # Deliberately keeps retrying once the cooldown expires: on an unattended VM a
  # restart is cheap, and giving up would leave the instance down until noticed.
  echo "restart skipped: cooldown active, retrying in $((RESTART_COOLDOWN - (now - last_restart)))s — restarts repeating in the journal need a human" >&2
  exit 1
fi

echo "restarting pixeleye-backend" >&2
cd "$COMPOSE_DIR" && docker compose restart pixeleye-backend || {
  echo "restart failed" >&2
  exit 1
}
echo "$now" > "$STATE_DIR/last_restart"
echo 0 > "$STATE_DIR/failures"
