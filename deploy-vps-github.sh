#!/bin/bash

# Script de Deploy para VPS - Versão GitHub
# Sistema de Scrap de Resultados do Jogo do Bicho
# Repositório: https://github.com/thiagogitai/jogodobicho

echo "🚀 Iniciando deploy do sistema de scrap..."
echo "📦 Repositório: https://github.com/thiagogitai/jogodobicho"

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Este script não deve ser executado como root"
   exit 1
fi

# Configurações
APP_DIR="/home/$USER/jogodobicho-scraper"
SERVICE_NAME="jogodobicho-scraper"
REPO_URL="https://github.com/thiagogitai/jogodobicho.git"
NODE_VERSION="22.14.0"

echo "📁 Diretório da aplicação: $APP_DIR"
echo "🔧 Nome do serviço: $SERVICE_NAME"

# 1. Instalar dependências do sistema
echo "📦 Instalando dependências do sistema..."
sudo apt update
sudo apt install -y git curl wget build-essential sqlite3

# 2. Verificar/Instalar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "📥 Node.js não encontrado, instalando..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js já instalado: $(node --version)"
fi

# 3. Clonar repositório
echo "📥 Clonando repositório..."
if [ -d "$APP_DIR" ]; then
    echo "📁 Diretório existe, atualizando..."
    cd $APP_DIR
    git pull origin main
else
    echo "📥 Clonando repositório..."
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# 4. Instalar dependências do Node.js
echo "📚 Instalando dependências do Node.js..."
npm install

# 5. Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

# 6. Criar arquivo de ambiente
echo "⚙️ Criando arquivo de ambiente..."
cat > .env << 'EOF'
# Configurações do Servidor
PORT=3333
NODE_ENV=production

# Configurações do Banco de Dados
DATABASE_PATH=./data/database.sqlite

# Configurações de Proxy
PROXY_ROTATION_ENABLED=true
PROXY_LIST_PATH=./config/proxies.txt

# Configurações da Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_api_key_aqui

# Configurações de Notificação
NOTIFICATION_ENABLED=true
NOTIFICATION_INTERVAL=300000

# Configurações de Log
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# 7. Criar diretórios necessários
echo "📂 Criando diretórios necessários..."
mkdir -p data logs config

# 8. Criar arquivo de proxies
echo "🌐 Criando arquivo de proxies..."
cat > config/proxies.txt << 'EOF'
# Lista de proxies - um por linha
# Formato: host:port ou host:port:username:password
# Adicione seus proxies aqui
EOF

# 9. Criar serviço systemd
echo "🔧 Criando serviço systemd..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Jogo do Bicho Scraper Service
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/api/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3333

# Logs
StandardOutput=append:/var/log/$SERVICE_NAME.log
StandardError=append:/var/log/$SERVICE_NAME-error.log

[Install]
WantedBy=multi-user.target
EOF

# 10. Configurar permissões
echo "🔐 Configurando permissões..."
sudo chown -R $USER:$USER $APP_DIR
sudo chmod +x dist/api/server.js

# 11. Criar script de inicialização
echo "📝 Criando script de inicialização..."
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Iniciando Jogo do Bicho Scraper..."
sudo systemctl start jogodobicho-scraper
echo "✅ Serviço iniciado!"
echo "📊 Status: sudo systemctl status jogodobicho-scraper"
echo "🌐 API: http://localhost:3333/api/health"
EOF

chmod +x start.sh

# 12. Criar script de parada
echo "🛑 Criando script de parada..."
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Parando Jogo do Bicho Scraper..."
sudo systemctl stop jogodobicho-scraper
echo "✅ Serviço parado!"
EOF

chmod +x stop.sh

# 13. Criar script de status
echo "📊 Criando script de status..."
cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 Status do Jogo do Bicho Scraper:"
echo "=================================="
sudo systemctl status jogodobicho-scraper --no-pager -l
echo ""
echo "📈 Uso de recursos:"
top -b -n1 | grep node | head -5
echo ""
echo "🌐 Endpoints disponíveis:"
echo "   Health Check: http://localhost:3333/api/health"
echo "   Documentação: http://localhost:3333/api/docs"
echo "   Resultados: http://localhost:3333/api/results"
EOF

chmod +x status.sh

# 14. Criar script de logs
echo "📋 Criando script de logs..."
cat > logs.sh << 'EOF'
#!/bin/bash
echo "📋 Logs do Jogo do Bicho Scraper:"
echo "================================="
echo "📄 Logs da aplicação:"
sudo tail -n 50 /var/log/jogodobicho-scraper.log
echo ""
echo "❌ Logs de erro:"
sudo tail -n 50 /var/log/jogodobicho-scraper-error.log
EOF

chmod +x logs.sh

# 15. Criar script de backup
echo "💾 Criando script de backup..."
cat > backup.sh << 'EOF'
#!/bin/bash
# Script de backup do banco de dados e configurações

BACKUP_DIR="/home/$USER/backups/jogodobicho"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "💾 Criando backup..."

# Backup do banco de dados
if [ -f "data/database.sqlite" ]; then
    cp data/database.sqlite $BACKUP_DIR/database_$DATE.sqlite
    echo "✅ Banco de dados: $BACKUP_DIR/database_$DATE.sqlite"
fi

# Backup dos logs
if [ -d "logs" ]; then
    cp -r logs $BACKUP_DIR/logs_$DATE
    echo "✅ Logs: $BACKUP_DIR/logs_$DATE"
fi

# Backup do .env
if [ -f ".env" ]; then
    cp .env $BACKUP_DIR/env_$DATE
    echo "✅ Configurações: $BACKUP_DIR/env_$DATE"
fi

echo "✅ Backup concluído em: $BACKUP_DIR"
EOF

chmod +x backup.sh

# 16. Criar script de atualização
echo "🔄 Criando script de atualização..."
cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Atualizando Jogo do Bicho Scraper..."

# Parar o serviço
sudo systemctl stop jogodobicho-scraper

# Backup do banco de dados
if [ -f "data/database.sqlite" ]; then
    echo "💾 Criando backup do banco de dados..."
    cp data/database.sqlite data/database_backup_$(date +%Y%m%d_%H%M%S).sqlite
fi

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Instalar dependências
echo "📚 Instalando dependências..."
npm install

# Compilar
echo "🔨 Compilando..."
npm run build

# Iniciar o serviço
echo "🚀 Iniciando serviço..."
sudo systemctl start jogodobicho-scraper

echo "✅ Sistema atualizado com sucesso!"
echo "📊 Verifique o status: ./status.sh"
EOF

chmod +x update.sh

# 17. Habilitar e iniciar o serviço
echo "🚀 Iniciando serviço..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

# Iniciar o serviço
./start.sh

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Scripts disponíveis:"
echo "   🚀 Iniciar: ./start.sh"
echo "   🛑 Parar: ./stop.sh"
echo "   📊 Status: ./status.sh"
echo "   📋 Logs: ./logs.sh"
echo "   💾 Backup: ./backup.sh"
echo "   🔄 Atualizar: ./update.sh"
echo ""
echo "📁 Diretório da aplicação: $APP_DIR"
echo "🌐 Porta da API: 3333"
echo "📊 Status do serviço: sudo systemctl status $SERVICE_NAME"
echo "📝 Logs: /var/log/$SERVICE_NAME.log"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configure o arquivo .env com suas credenciais"
echo "   2. Adicione proxies em config/proxies.txt (se necessário)"
echo "   3. Configure a Evolution API"
echo "   4. Configure o nginx (recomendado) para proxy reverso"
echo ""
echo "🌐 Acesse a API em: http://localhost:3333/api/health"
echo "📚 Documentação da API: http://localhost:3333/api/docs"

# Mostrar status final
./status.sh