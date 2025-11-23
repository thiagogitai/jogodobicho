# 🔗 Integração Evolution API v2 - Servidor Externo

## ✅ Configuração Implementada

O sistema está configurado para usar o Evolution API v2 rodando em servidor externo.

### **Servidor Configurado**
- **URL**: `https://solitarybaboon-evolution.cloudfy.live`
- **Token**: `0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc`
- **Versão**: 2.3.5

---

## 🎯 Funcionalidades Implementadas

### **1. Gerenciamento de Instâncias**

#### **Criar Instância**
```bash
POST /api/evolution/instances
Authorization: Bearer seu-token
Content-Type: application/json

{
  "instanceName": "minha-instancia",
  "token": "token-opcional",
  "qrcode": true,
  "webhook": {
    "url": "https://seu-servidor.com/webhook",
    "webhook_by_events": true,
    "events": ["message", "status"]
  },
  "settings": {
    "reject_call": false,
    "groups_ignore": false,
    "always_online": true,
    "read_messages": true,
    "read_status": true
  }
}
```

#### **Listar Instâncias**
```bash
GET /api/evolution/instances
Authorization: Bearer seu-token
```

#### **Obter Instância Específica**
```bash
GET /api/evolution/instances/:instanceName
Authorization: Bearer seu-token
```

#### **Obter QR Code**
```bash
GET /api/evolution/instances/:instanceName/qrcode
Authorization: Bearer seu-token
```

#### **Deletar Instância**
```bash
DELETE /api/evolution/instances/:instanceName
Authorization: Bearer seu-token
```

#### **Reiniciar Instância**
```bash
POST /api/evolution/instances/:instanceName/restart
Authorization: Bearer seu-token
```

#### **Logout/Desconectar**
```bash
POST /api/evolution/instances/:instanceName/logout
Authorization: Bearer seu-token
```

#### **Testar Conexão**
```bash
GET /api/evolution/test
Authorization: Bearer seu-token
```

---

## 📋 Endpoints da API

### **Todas as rotas exigem autenticação por token**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/evolution/instances` | Criar nova instância |
| GET | `/api/evolution/instances` | Listar todas as instâncias |
| GET | `/api/evolution/instances/:name` | Obter instância específica |
| GET | `/api/evolution/instances/:name/qrcode` | Obter QR Code |
| DELETE | `/api/evolution/instances/:name` | Deletar instância |
| POST | `/api/evolution/instances/:name/restart` | Reiniciar instância |
| POST | `/api/evolution/instances/:name/logout` | Desconectar instância |
| GET | `/api/evolution/test` | Testar conexão |

---

## 🔧 Configuração

### **Variáveis de Ambiente**

Adicione ao arquivo `.env`:

```env
# Evolution API - Servidor Externo
EVOLUTION_API_URL=https://solitarybaboon-evolution.cloudfy.live
EVOLUTION_API_TOKEN=0eX8TyfZjyRQVryI2b7Mx6bvSAQUQHsc
EVOLUTION_INSTANCE_NAME=default
```

**Nota**: O sistema já está configurado com esses valores como padrão.

---

## 📝 Exemplos de Uso

### **1. Criar Instância e Obter QR Code**

```bash
# 1. Criar instância
curl -X POST "http://localhost:3000/api/evolution/instances" \
  -H "Authorization: Bearer seu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "whatsapp-jogodobicho",
    "qrcode": true
  }'

# 2. Obter QR Code para conectar WhatsApp
curl -X GET "http://localhost:3000/api/evolution/instances/whatsapp-jogodobicho/qrcode" \
  -H "Authorization: Bearer seu-token"
```

### **2. Listar Todas as Instâncias**

```bash
curl -X GET "http://localhost:3000/api/evolution/instances" \
  -H "Authorization: Bearer seu-token"
```

### **3. Verificar Status de Conexão**

```bash
curl -X GET "http://localhost:3000/api/evolution/instances/whatsapp-jogodobicho" \
  -H "Authorization: Bearer seu-token"
```

### **4. Testar Conexão com Servidor**

```bash
curl -X GET "http://localhost:3000/api/evolution/test" \
  -H "Authorization: Bearer seu-token"
```

---

## 🔄 Fluxo de Trabalho

### **1. Primeira Configuração**

1. **Criar instância**:
   ```bash
   POST /api/evolution/instances
   { "instanceName": "minha-instancia" }
   ```

2. **Obter QR Code**:
   ```bash
   GET /api/evolution/instances/minha-instancia/qrcode
   ```

3. **Escanear QR Code** com WhatsApp

4. **Verificar status**:
   ```bash
   GET /api/evolution/instances/minha-instancia
   ```

### **2. Enviar Mensagens**

Após a instância estar conectada, use o `MessageService` que já está integrado:

```typescript
const evolutionService = createEvolutionAPIService();
await evolutionService.sendWhatsAppMessage(
  'minha-instancia',
  '5511999999999@g.us', // ID do grupo
  'Mensagem de teste'
);
```

---

## 🔒 Segurança

- ✅ Todas as rotas protegidas por token
- ✅ Token do Evolution API armazenado em variável de ambiente
- ✅ Validação de instâncias antes de operações
- ✅ Logs de todas as operações

---

## 📊 Status da Instância

Os possíveis estados de uma instância:

- **`open`**: Conectada e funcionando
- **`close`**: Desconectada
- **`connecting`**: Conectando
- **`error`**: Erro na conexão

---

## 🚀 Próximos Passos

1. **Criar instância** via API
2. **Obter QR Code** e conectar WhatsApp
3. **Configurar grupos** no sistema para usar a instância
4. **Testar envio** de mensagens

---

**Status**: ✅ **Integrado e Funcional**  
**Servidor**: https://solitarybaboon-evolution.cloudfy.live  
**Data**: 2025-01-21

