# 🚀 Guia de Instalação na VPS

## Passo 1: Preparar a VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git build-essential sqlite3 nginx

# Instalar Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Passo 2: Baixar e executar o deploy

```bash
# Baixar o script de deploy
wget https://raw.githubusercontent.com/thiagogitai/jogodobicho/main/deploy-vps-github.sh

# Tornar executável
chmod +x deploy-vps-github.sh

# Executar o deploy
./deploy-vps-github.sh
```

## Passo 3: Configurar Nginx (se já tiver outro site)

```bash
# Copiar configuração do nginx
sudo cp nginx-config.txt /etc/nginx/sites-available/jogodobicho-scraper

# Editar o arquivo para seu domínio
sudo nano /etc/nginx/sites-available/jogodobicho-scraper

# Habilitar site
sudo ln -s /etc/nginx/sites-available/jogodobicho-scraper /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar nginx
sudo systemctl reload nginx
```

## Passo 4: Configurar SSL com Let's Encrypt

```bash
# Instalar certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado (substitva pelo seu domínio)
sudo certbot --nginx -d seu-dominio.com

# Certificado será renovado automaticamente
```

## Passo 5: Configurar o sistema

```bash
# Entrar no diretório
cd ~/jogodobicho-scraper

# Editar configurações
nano .env

# Adicionar proxies (se necessário)
nano config/proxies.txt

# Iniciar serviço
./start.sh
```

## Passo 6: Verificar funcionamento

```bash
# Verificar status
./status.sh

# Ver logs
./logs.sh

# Testar API
curl http://localhost:3333/api/health
```

## Comandos úteis

```bash
# Iniciar sistema
./start.sh

# Parar sistema
./stop.sh

# Ver status
./status.sh

# Ver logs
./logs.sh

# Backup
./backup.sh

# Atualizar
./update.sh
```

## Configuração do .env

```env
# Porta do servidor
PORT=3333

# Banco de dados
DATABASE_PATH=./data/database.sqlite

# Evolution API (configure sua instância)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_aqui

# Proxy (opcional)
PROXY_ROTATION_ENABLED=true
PROXY_LIST_PATH=./config/proxies.txt

# Notificações
NOTIFICATION_ENABLED=true
NOTIFICATION_INTERVAL=300000
```

## Configurar Evolution API

1. Instale a Evolution API em outra porta (ex: 8080)
2. Configure suas conexões WhatsApp/Telegram
3. Adicione a API key no .env

## Segurança

```bash
# Firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Fail2ban
sudo apt install -y fail2ban
```

## Monitoramento

```bash
# Instalar monitor
sudo apt install -y htop iotop

# Ver recursos
htop
```

## Suporte

Se tiver problemas:
1. Verifique os logs: `./logs.sh`
2. Verifique status: `./status.sh`
3. Reinicie o serviço: `./stop.sh && ./start.sh`
4. Verifique firewall e nginx