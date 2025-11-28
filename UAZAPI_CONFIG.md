# Configuração do UazAPI

Este projeto agora usa o **UazAPI** para envio de mensagens via WhatsApp.

## Configuração

1. **Obtenha suas credenciais do UazAPI:**
   - Acesse o painel do UazAPI
   - Copie seu Token de API
   - Copie o ID da sua instância

2. **Configure as variáveis de ambiente:**

Edite o arquivo `.env` e adicione:

```bash
# UazAPI - WhatsApp API
UAZAPI_URL=https://api.uazapi.com
UAZAPI_TOKEN=seu-token-aqui
UAZAPI_INSTANCE_ID=sua-instancia-id
```

3. **Teste a conexão:**

Após configurar, reinicie o servidor e acesse:
```
http://localhost:3001/api/health
```

## Endpoints da UazAPI

O serviço UazAPI implementa os seguintes métodos:

- `sendWhatsAppMessage(phoneNumber, message)` - Envia mensagem para um número
- `sendGroupMessage(groupId, message)` - Envia mensagem para um grupo
- `sendImage(phoneNumber, imageUrl, caption)` - Envia imagem
- `getQRCode()` - Obtém QR Code da instância
- `getStatus()` - Verifica status da conexão
- `testConnection()` - Testa conexão com a API

## Diferenças do Evolution API

O UazAPI substitui completamente o Evolution API. As principais diferenças:

1. **Autenticação:** Usa Bearer Token ao invés de apikey
2. **Endpoints:** URLs diferentes mas funcionalidade similar
3. **Configuração:** Mais simples, apenas 3 variáveis de ambiente

## Troubleshooting

Se você encontrar erros:

1. Verifique se o token está correto
2. Verifique se a instância está ativa no painel do UazAPI
3. Verifique os logs em `logs/app.log`
4. Teste a conexão com: `curl -H "Authorization: Bearer SEU_TOKEN" https://api.uazapi.com/health`

## Documentação Completa

Para mais informações, consulte a documentação oficial do UazAPI.
