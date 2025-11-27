#!/bin/bash

# Script de Deploy para VPS
# Sistema de Scrap de Resultados do Jogo do Bicho

echo "🚀 Iniciando deploy do sistema de scrap..."

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   echo "❌ Este script não deve ser executado como root"
   exit 1
fi

# Configurações
APP_DIR="/home/$USER/jogodobicho-scraper"
SERVICE_NAME="jogodobicho-scraper"
NODE_VERSION="22.14.0"

echo "📁 Diretório da aplicação: $APP_DIR"
echo "🔧 Nome do serviço: $SERVICE_NAME"

# 1. Criar diretório da aplicação
echo "📂 Criando diretório da aplicação..."
mkdir -p $APP_DIR
cd $APP_DIR

# 2. Verificar/Instalar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "📥 Node.js não encontrado, instalando..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js já instalado"
fi

# 3. Copiar arquivos do projeto (assumindo que o projeto está no diretório atual)
echo "📋 Copiando arquivos do projeto..."
if [ -d "../jogodobicho" ]; then
    cp -r ../jogodobicho/* $APP_DIR/
else
    echo "❌ Diretório do projeto não encontrado. Por favor, copie os arquivos manualmente para $APP_DIR"
    exit 1
fi

# 4. Instalar dependências
echo "📚 Instalando dependências..."
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

# 8. Criar arquivo de proxies (exemplo)
echo "🌐 Criando arquivo de proxies..."
cat > config/proxies.txt << 'EOF'
# Lista de proxies - um por linha
# Formato: host:port ou host:port:username:password
# Exemplos:
# 127.0.0.1:8080
# proxy.example.com:3128:user:pass
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

# 10. Habilitar e iniciar o serviço
echo "🚀 Habilitando e iniciando o serviço..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# 11. Verificar status do serviço
echo "📊 Verificando status do serviço..."
sudo systemctl status $SERVICE_NAME --no-pager

# 12. Criar script de backup
echo "💾 Criando script de backup..."
cat > backup.sh << 'EOF'
#!/bin/bash
# Script de backup do banco de dados

BACKUP_DIR="/home/$USER/backups/jogodobicho"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup do banco de dados
cp data/database.sqlite $BACKUP_DIR/database_$DATE.sqlite

# Backup dos logs
cp -r logs $BACKUP_DIR/logs_$DATE

echo "Backup criado em: $BACKUP_DIR/database_$DATE.sqlite"
EOF

chmod +x backup.sh

# 13. Criar script de atualização
echo "🔄 Criando script de atualização..."
cat > update.sh << 'EOF'
#!/bin/bash
# Script de atualização do sistema

echo "🔄 Atualizando sistema..."

# Parar o serviço
sudo systemctl stop jogodobicho-scraper

# Backup do banco de dados
cp data/database.sqlite data/database_backup_$(date +%Y%m%d_%H%M%S).sqlite

# Atualizar código
git pull origin main 2>/dev/null || echo "Git não configurado, atualize manualmente"

# Instalar dependências
npm install

# Compilar
npm run build

# Iniciar o serviço
sudo systemctl start jogodobicho-scraper

echo "✅ Sistema atualizado com sucesso!"
EOF

chmod +x update.sh

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Informações importantes:"
echo "   📁 Diretório da aplicação: $APP_DIR"
echo "   🌐 Porta da API: 3333"
echo "   📊 Status do serviço: sudo systemctl status $SERVICE_NAME"
echo "   📝 Logs: /var/log/$SERVICE_NAME.log"
echo "   💾 Backup: ./backup.sh"
echo "   🔄 Atualização: ./update.sh"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configure o arquivo .env com suas credenciais"
echo "   2. Adicione proxies em config/proxies.txt (se necessário)"
echo "   3. Configure a Evolution API"
echo "   4. Configure o nginx (recomendado)"
echo ""
echo "🌐 Acesse a API em: http://localhost:3333/api/health"
echo "📚 Documentação da API: http://localhost:3333/api/docs"

# Mostrar logs iniciais
echo ""
echo "📄 Logs do serviço (últimas 20 linhas):"
sudo tail -n 20 /var/log/$SERVICE_NAME.log