#!/usr/bin/env bash
# Render deployment config from templates, substituting the sslip.io hostnames
# and secrets from .env. Safe to re-run; regenerates generated/ in place.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "error: .env not found. Copy .env.example and fill it in:" >&2
  echo "  cp .env.example .env && chmod 600 .env && \$EDITOR .env" >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; . ./.env; set +a

: "${PIXELEYE_HOST_BASE:?must be set in .env (e.g. 34.65.1.2.sslip.io)}"
: "${ACME_EMAIL:?must be set in .env}"
: "${KRATOS_COOKIE_SECRET:?must be set in .env}"
: "${KRATOS_CIPHER_SECRET:?must be set in .env}"
: "${GITHUB_APP_ID:?must be set in .env (GitHub App settings page)}"
: "${GITHUB_APP_NAME:?must be set in .env (the URL slug in github.com/apps/<slug>)}"
: "${GITHUB_APP_CLIENT_ID:?must be set in .env}"
: "${GITHUB_APP_CLIENT_SECRET:?must be set in .env}"
: "${GITHUB_APP_PRIVATE_KEY:?must be set in .env (contents of the .pem, double-quoted)}"

# Fail loudly rather than deploying a stack with shipped default credentials.
for var in MINIO_ROOT_PASSWORD DB_PASSWORD AMQP_PASSWORD S3_KEY_SECRET \
           GITHUB_APP_ID GITHUB_APP_NAME GITHUB_APP_CLIENT_ID GITHUB_APP_CLIENT_SECRET; do
  val="${!var:-}"
  if [ -z "$val" ] || [ "$val" = "CHANGEME" ]; then
    echo "error: $var is unset or still CHANGEME" >&2
    exit 1
  fi
done

if [[ "$GITHUB_APP_PRIVATE_KEY" == *CHANGEME* ]] || [[ "$GITHUB_APP_PRIVATE_KEY" != *"PRIVATE KEY-----"* ]]; then
  echo "error: GITHUB_APP_PRIVATE_KEY must be the full .pem contents, double-quoted" >&2
  exit 1
fi

if [ "${#KRATOS_CIPHER_SECRET}" -ne 32 ]; then
  echo "error: KRATOS_CIPHER_SECRET must be exactly 32 characters (got ${#KRATOS_CIPHER_SECRET})" >&2
  exit 1
fi

mkdir -p generated/kratos

envsubst < Caddyfile.tmpl > generated/Caddyfile
envsubst < kratos.yml.tmpl > generated/kratos/kratos.yml
cp ../config/identity.schema.json generated/kratos/identity.schema.json
cp ../config/github.jsonnet generated/kratos/github.jsonnet

chmod 600 .env

echo "rendered for host base: ${PIXELEYE_HOST_BASE}"
echo "  generated/Caddyfile"
echo "  generated/kratos/kratos.yml"
echo
echo "next: docker compose up -d"
