# 🔐 Autenticação da API - Sistema de Tokens

## ✅ Implementação

Todas as rotas da API (exceto health check e login) são **protegidas por token de autenticação**.

---

## 🔑 Como Obter um Token

### **1. Login (Endpoint Público)**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "token": "abc123def456...",
  "expires_at": "2026-01-21T00:00:00.000Z",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### **2. Usar o Token**

Todas as requisições autenticadas devem incluir o token no header:

```bash
Authorization: Bearer abc123def456...
```

---

## 📋 Rotas Protegidas

### **Todas as rotas abaixo exigem token:**

- `GET /api/status` - Status do sistema
- `GET /api/results` - Listar resultados
- `GET /api/results/:id` - Obter resultado específico
- `POST /api/results` - Criar resultado
- `PUT /api/results/:id` - Atualizar resultado
- `DELETE /api/results/:id` - Deletar resultado
- `POST /api/scrape` - Executar scrape
- `GET /api/templates` - Listar templates
- `GET /api/templates/:lotteryType` - Template por tipo
- `GET /api/schedules` - Listar agendamentos
- `POST /api/schedules` - Criar agendamento
- `PUT /api/schedules/:id` - Atualizar agendamento
- `DELETE /api/schedules/:id` - Deletar agendamento
- `GET /api/logs` - Logs de execução
- `POST /api/tokens` - Criar novo token
- `GET /api/tokens` - Listar tokens
- `DELETE /api/tokens/:id` - Deletar token
- `GET /api/stats` - Estatísticas

---

## 🔓 Rotas Públicas

Apenas estas rotas não exigem autenticação:

- `GET /api/health` - Health check (monitoramento)
- `POST /api/auth/login` - Login para obter token

---

## 📝 Exemplos de Uso

### **Exemplo 1: Obter Resultados**

```bash
curl -X GET "http://localhost:3000/api/results" \
  -H "Authorization: Bearer seu-token-aqui"
```

### **Exemplo 2: Criar Resultado**

```bash
curl -X POST "http://localhost:3000/api/results" \
  -H "Authorization: Bearer seu-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "lottery_type": "FEDERAL",
    "date": "2025-01-21",
    "results": {
      "first": "1234",
      "second": "5678",
      "third": "9012"
    }
  }'
```

### **Exemplo 3: Executar Scrape**

```bash
curl -X POST "http://localhost:3000/api/scrape" \
  -H "Authorization: Bearer seu-token-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "lottery_types": ["FEDERAL", "RIO_DE_JANEIRO"]
  }'
```

---

## ⚠️ Respostas de Erro

### **401 Unauthorized**
```json
{
  "error": "Token de autenticação necessário"
}
```

### **403 Forbidden**
```json
{
  "error": "Token inválido ou expirado"
}
```

---

## 🔧 Gerenciamento de Tokens

### **Criar Novo Token**

```bash
POST /api/tokens
Authorization: Bearer token-existente
Content-Type: application/json

{
  "name": "Token para App Mobile",
  "expires_in_days": 365
}
```

### **Listar Tokens**

```bash
GET /api/tokens
Authorization: Bearer seu-token
```

### **Deletar Token**

```bash
DELETE /api/tokens/:id
Authorization: Bearer seu-token
```

---

## 🔒 Segurança

1. ✅ **Tokens expiram**: Configurável (padrão: 365 dias)
2. ✅ **Tokens podem ser revogados**: Deletar token desativa imediatamente
3. ✅ **Rate limiting**: 100 requisições por 15 minutos por IP
4. ✅ **Validação de expiração**: Tokens expirados são rejeitados
5. ✅ **Rastreamento de uso**: Último uso e contador de requisições

---

## 📊 Usuário Padrão

**Username**: `admin`  
**Password**: `admin123`  
**Role**: `admin`

⚠️ **IMPORTANTE**: Altere a senha padrão em produção!

---

## 🚀 Próximos Passos Recomendados

1. **Alterar senha padrão** do admin
2. **Criar usuários específicos** para diferentes aplicações
3. **Configurar expiração** adequada para tokens
4. **Implementar refresh tokens** (opcional)
5. **Adicionar 2FA** (opcional)

---

**Status**: ✅ **Todas as rotas protegidas por token**  
**Data**: 2025-01-21

