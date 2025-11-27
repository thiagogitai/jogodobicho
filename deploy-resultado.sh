#!/bin/bash
set -e

DOMAIN="${DOMAIN:-resultado.certcrm.com.br}"
APP_DIR="/opt/resultado"
SERVICE_NAME="resultado"
EVOLUTION_API_URL="${EVOLUTION_API_URL:-http://localhost:8080}"
EVOLUTION_API_KEY="${EVOLUTION_API_KEY:-}"

sudo apt update
sudo apt install -y git curl build-essential sqlite3 nginx certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
fi

sudo mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  sudo git -C "$APP_DIR" pull
else
  sudo git clone https://github.com/thiagogitai/jogodobicho "$APP_DIR"
fi

cd "$APP_DIR"
sudo npm install
sudo npm run build
sudo mkdir -p "$APP_DIR/data" "$APP_DIR/logs" "$APP_DIR/config"

sudo tee "$APP_DIR/.env" >/dev/null <<EOF
PORT=3333
DATABASE_PATH=./data/database.sqlite
EVOLUTION_API_URL=$EVOLUTION_API_URL
EVOLUTION_API_KEY=$EVOLUTION_API_KEY
EOF

sudo chown -R www-data:www-data "$APP_DIR"

sudo tee /etc/systemd/system/"$SERVICE_NAME".service >/dev/null <<EOF
[Unit]
Description=Resultado Service
After=network.target
[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/api/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3333
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

sudo tee /etc/nginx/sites-available/resultado.conf >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    access_log /var/log/nginx/resultado.access.log;
    error_log  /var/log/nginx/resultado.error.log;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:3333/api/health;
    }

    location ~* \.(env|log|sqlite)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/resultado.conf /etc/nginx/sites-enabled/resultado.conf
sudo nginx -t
sudo systemctl reload nginx

sudo certbot --nginx -d "$DOMAIN" || true
sudo systemctl reload nginx

echo "https://$DOMAIN/health"