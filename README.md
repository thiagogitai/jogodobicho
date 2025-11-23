# Sistema de Scrape Jogo do Bicho

Sistema automatizado para coleta e envio de resultados do jogo do bicho via WhatsApp e Telegram.

## 🚀 Tecnologias

- **Backend**: Node.js + TypeScript + Express
- **Banco de Dados**: Supabase (PostgreSQL)
- **Cache/Queue**: Redis
- **Scrape**: Puppeteer + Cheerio + Proxy Rotation
- **Mensagens**: Evolution API v2 (WhatsApp/Telegram)
- **Frontend**: React (em desenvolvimento)

## 📋 Funcionalidades

- ✅ Scrape automático de resultados de múltiplas fontes
- ✅ Envio para grupos WhatsApp/Telegram via Evolution API
- ✅ Proxy rotation para evitar bloqueios
- ✅ Agendamento configurável
- ✅ Templates de mensagens personalizáveis
- ✅ Interface web para gerenciamento
- ✅ Edição manual de resultados
- ✅ Sistema de notificações e logs

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## 📊 Estrutura do Projeto

```
src/
├── controllers/     # Controladores REST
├── services/        # Lógica de negócio
├── models/         # Modelos de dados
├── middlewares/    # Middlewares Express
├── utils/          # Utilitários
├── scrapers/       # Módulos de scrape
├── jobs/          # Tarefas agendadas
├── types/         # Definições TypeScript
└── server.ts      # Entry point
```

## 🔗 Integrações

### Evolution API v2
Configure as credenciais no arquivo `.env`:
```
EVOLUTION_API_URL=https://sua-instancia.evolution-api.com
EVOLUTION_API_TOKEN=seu-token-aqui
```

### Supabase
Configure as credenciais do Supabase:
```
SUPABASE_URL=https://sua-instancia.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_KEY=sua-chave-service
```

### Redis
Configure a conexão Redis:
```
REDIS_URL=redis://localhost:6379
```

## 📝 Comandos

```bash
# Executar scrape manual
npm run scrape

# Ver logs
npm run logs

# Testes
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## 🔐 Segurança

- Rate limiting implementado
- Validação de dados com Joi
- CORS configurado
- Helmet para segurança de headers
- Autenticação JWT

## 📞 Suporte

Para dúvidas e suporte, consulte a documentação em `.trae/documents/`.