#!/usr/bin/env bash
# Installs the pixeleye watchdog on the VM. Run as root from this directory.
set -euo pipefail
cd "$(dirname "$0")"

install -m 755 pixeleye-watchdog.sh /usr/local/sbin/pixeleye-watchdog.sh
install -m 644 pixeleye-watchdog.service pixeleye-watchdog.timer /etc/systemd/system/

if [ ! -f /etc/pixeleye-watchdog.env ]; then
  install -m 600 /dev/null /etc/pixeleye-watchdog.env
  cat > /etc/pixeleye-watchdog.env <<'EOF'
# Same values as the dsp-das PIXELEYE_TOKEN secret and PIXELEYE_ENDPOINT variable.
PIXELEYE_TOKEN=
PIXELEYE_ENDPOINT=https://api.pixeleye.ops.dasch.swiss
EOF
  echo "Created /etc/pixeleye-watchdog.env — set PIXELEYE_TOKEN, then re-run this script."
  exit 0
fi

systemctl daemon-reload
systemctl enable --now pixeleye-watchdog.timer
systemctl start pixeleye-watchdog.service
systemctl --no-pager status pixeleye-watchdog.service | tail -5
