# Pixeleye VM deployment

Hardened single-VM deployment of self-hosted pixeleye for the advisory CI trial
(DEV-7238). See the
[plan](https://github.com/dasch-swiss/dasch-specs/blob/main/specs/2026-09-11-pixeleye-visual-regression-ci/02-feat-pixeleye-visual-regression-ci-plan.md).

## Why this is a standalone compose file

Docker Compose **merges** `ports:` entries across files — it cannot remove them. Since
hardening is mostly *deleting* published ports, an overlay on
`../docker-compose-self-hosting.yml` cannot express it. This file redeclares every
service instead.

## What differs from the self-hosting file

| Change | Why |
|---|---|
| Six `ports:` entries deleted | mailslurper 4436/4437, kratos admin 4434, postgres 5431, rabbitmq 5672/15672 must never be public |
| Caddy added, only container bound to 0.0.0.0 | Single TLS entry point, automatic Let's Encrypt |
| All credentials from `.env` | No `CHANGEME` in a deployed stack |
| Scoped MinIO service account | Pixeleye never holds root storage credentials |
| Postgres healthcheck + `depends_on: service_healthy` | Migrations raced the DB on boot |
| `MINIO_SERVER_URL` set | Presigned URLs must be signed for the external host |

## Prerequisites

- A GCE VM with a **reserved static external IP** (an ephemeral IP is released on stop,
  which changes every hostname and invalidates certificates)
- VPC firewall allowing only `tcp:80,443` from `0.0.0.0/0`; SSH via IAP
- Ports 80 and 443 reachable — Let's Encrypt validates over HTTP-01
- Docker Engine ≥ 28
- `envsubst` (package `gettext-base` on Debian/Ubuntu — not present on minimal images)

## Deploy

```bash
cp .env.example .env
chmod 600 .env
$EDITOR .env          # set PIXELEYE_HOST_BASE=<STATIC_IP>.sslip.io, generate secrets

./render.sh           # substitutes hostnames/secrets into generated/
docker compose up -d
```

Generate each secret **on the VM**:

```bash
openssl rand -base64 32 | tr -d '/+=' | head -c 32
```

`render.sh` refuses to run if any secret is still `CHANGEME` or if
`KRATOS_CIPHER_SECRET` is not exactly 32 characters.

## After first start

1. Open `https://<HOST_BASE>` and register the single trial account.
2. Create the project — the UI works, and so does the REST API
   (`POST /v1/teams/<teamID>/projects`).
3. Build the token yourself: the create response returns only `pxi__<secret>`, which is
   rejected with `401`. A usable token is that value **plus `:<projectID>`**:
   `pxi__<secret>:<projectID>`. The UI does this concatenation for you; the API does not.
4. Set the project's **`autoApprove` to `main`**, or every baseline needs manual
   approval and "advisory" quietly becomes recurring manual work. The endpoint is
   `PATCH /v1/projects/<projectID>/admin` — note the `/admin` suffix; without it you get
   a `404`.
5. Add `PIXELEYE_TOKEN` and `PIXELEYE_ENDPOINT=https://api.<HOST_BASE>` as `dsp-das`
   repository secrets.

## Verify hardening

From **outside** GCP, all of these must fail to connect:

```bash
for p in 4434 4436 4437 5431 5672 15672 9000; do
  nc -z -w3 <STATIC_IP> $p && echo "EXPOSED: $p" || echo "ok: $p closed"
done
```

Only 80 and 443 should answer. Port 9000 closing is correct — MinIO is reached through
Caddy on `s3.<HOST_BASE>`, not directly.

## Known gotchas

- **Never run the CLI from a developer machine against this instance.** Baselines are
  environment-specific: a macOS-rendered snapshot compared against an Ubuntu CI render
  flags *every* glyph, because font antialiasing and hinting differ between platforms.
  It looks exactly like "the text changed" when nothing changed. Baselines must be
  established by CI and compared against CI. This was learned the hard way — the first
  CI build flagged 22 of 25 snapshots against a laptop-seeded baseline, and the only
  ones that passed were the logo-only stories with no text.
- **Leave `snapshotThreshold` at pixeleye's default of `0.05`.** Setting it to `0` makes
  a single differing pixel a failure, which guarantees antialiasing noise. `snapshotBlur`
  is also on for the same reason.

- **`NEXT_PUBLIC_BACKEND_URL` is the INTERNAL one.** The names are inverted:
  `NEXT_PUBLIC_BACKEND_URL` is consumed server-side, `BACKEND_URL` by the browser.
  Setting `NEXT_PUBLIC_*` to the public hostname gives `ECONNREFUSED 127.0.0.1:443`
  and reproduces upstream issue #343.
- **A bad S3 certificate fails silently.** Snapshots load as `<img>` subresources, so a
  rejected cert produces blank tiles with no error anywhere.
- **Never `docker compose down -v`** — that deletes `caddy-data` (certificates and the
  ACME account key) along with all baselines.
- Upstream is dormant: CLI `0.8.8` and the backend images both date from June 2024.
