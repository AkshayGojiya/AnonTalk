#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 22.04 GCP e2-micro VM.
# Run this once via SSH after the VM is created and DNS (an A record for
# DOMAIN pointing at the VM's external IP) is already live -- Certbot's
# HTTP-01 challenge will fail otherwise.
#
# Usage: DOMAIN=api.example.com GHCR_OWNER=yourgithubuser ./provision.sh
#
# Certbot runs on the host (not containerized) so `certbot renew` and its
# systemd timer stay simple; nginx runs in Docker and reads the host's
# /etc/letsencrypt and /var/www/certbot directly via bind mounts.

set -euo pipefail

if [ -z "${DOMAIN:-}" ]; then
  echo "Set DOMAIN, e.g.: DOMAIN=api.example.com GHCR_OWNER=you ./provision.sh" >&2
  exit 1
fi
if [ -z "${GHCR_OWNER:-}" ]; then
  echo "Set GHCR_OWNER (your GitHub username/org, lowercase) too." >&2
  exit 1
fi

APP_DIR=/opt/anontalk
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
fi

echo "==> Installing Certbot + ufw"
sudo apt-get update -y
sudo apt-get install -y certbot ufw gettext-base

echo "==> Firewall (ufw)"
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "==> Laying out $APP_DIR"
sudo mkdir -p "$APP_DIR/nginx/conf.d" /var/www/certbot
sudo chown -R "$USER":"$USER" "$APP_DIR"

cp "$SCRIPT_DIR/../docker/docker-compose.prod.yml" "$APP_DIR/docker-compose.yml"
cp "$SCRIPT_DIR/../nginx/anontalk.bootstrap.conf" "$APP_DIR/nginx/conf.d/anontalk.conf"
cp "$SCRIPT_DIR/../nginx/anontalk.conf.template" "$APP_DIR/nginx/anontalk.conf.template"

if [ ! -f "$APP_DIR/api.env" ]; then
  cat > "$APP_DIR/api.env" <<'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=
REDIS_URL=
WEB_APP_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
EOF
  echo "!! Wrote a blank $APP_DIR/api.env -- fill in real values (see docs/ACTION_ITEMS.md Part B), then re-run this script."
  exit 0
fi

if grep -qE '^(DATABASE_URL|REDIS_URL|JWT_ACCESS_SECRET)=$' "$APP_DIR/api.env"; then
  echo "!! $APP_DIR/api.env still has blank required values -- fill it in and re-run." >&2
  exit 1
fi

cat > "$APP_DIR/.env" <<EOF
GHCR_OWNER=$GHCR_OWNER
IMAGE_TAG=latest
EOF

cd "$APP_DIR"

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "==> Starting nginx in HTTP-only bootstrap mode (no certificate yet)"
  docker compose up -d nginx

  echo "==> Requesting initial certificate for $DOMAIN"
  sudo certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

  echo "==> Swapping in the real HTTPS config"
  DOMAIN="$DOMAIN" envsubst '${DOMAIN}' < "$APP_DIR/nginx/anontalk.conf.template" > "$APP_DIR/nginx/conf.d/anontalk.conf"
else
  echo "==> Certificate already exists for $DOMAIN, skipping issuance"
  DOMAIN="$DOMAIN" envsubst '${DOMAIN}' < "$APP_DIR/nginx/anontalk.conf.template" > "$APP_DIR/nginx/conf.d/anontalk.conf"
fi

echo "==> Starting full stack"
docker compose up -d

echo "==> Installing renewal timer"
sudo tee /etc/systemd/system/certbot-renew.service > /dev/null <<EOF
[Unit]
Description=Renew Let's Encrypt certs and reload nginx

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --deploy-hook "docker compose -f $APP_DIR/docker-compose.yml exec nginx nginx -s reload"
EOF

sudo tee /etc/systemd/system/certbot-renew.timer > /dev/null <<'EOF'
[Unit]
Description=Run certbot-renew twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now certbot-renew.timer

echo "==> Done. Verify with: curl -I https://$DOMAIN/health"
echo "    Log out and back in once so the 'docker' group membership takes effect (only needed the first time Docker was installed)."
