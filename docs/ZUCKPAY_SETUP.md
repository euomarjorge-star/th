# Configuração do Gateway Zuckpay

## Resumo das Mudanças Realizadas

✅ **Arquivo criado:** `functions/gateways/zuckpay.js` - Integração completa com API Zuckpay
✅ **Atualizado:** `functions/lib/gateway-factory.js` - Registra o gateway Zuckpay
✅ **Atualizado:** `.env.local` - Mudou de GorillaPay para Zuckpay

---

## Obtenção das Credenciais Zuckpay

### 1. Acesse o Painel Zuckpay
- URL: https://dashboard.zuckpay.com.br (ou seu link específico)
- Faça login com suas credenciais

### 2. Localize as Chaves de API
Navegue para: **Configurações → API Keys** ou **Developer**

Você encontrará:
- **API Key** (também chamada de "Access Token" ou "Secret Key")
- **API Secret** (se houver autenticação dupla)

### 3. Localize o Webhook Secret
Navegue para: **Configurações → Webhooks**

Você encontrará:
- **Webhook Secret** (para validar requisições recebidas)

---

## Atualizar `.env.local`

Após obter as credenciais do Zuckpay, atualize o arquivo `.env.local`:

```env
# ===================================
# GATEWAY DE PAGAMENTOS
# ===================================
PAYMENT_GATEWAY=zuckpay
GATEWAY_API_KEY=cole_sua_api_key_zuckpay_aqui
GATEWAY_API_SECRET=cole_sua_api_secret_zuckpay_aqui
GATEWAY_WEBHOOK_SECRET=cole_seu_webhook_secret_aqui
```

### Onde colar:
1. Abra `.env.local` na raiz do projeto
2. Substitua os placeholders pelas credenciais reais
3. Salve o arquivo
4. Reinicie o servidor: `npm start`

---

## Configurar Webhook no Painel Zuckpay

Após ter a API funcionando, configure o webhook:

### URL do Webhook
```
https://seu-dominio.com/api/webhook/payment
```

### Eventos a Ativar
- `charge.created` - Cobrança criada
- `charge.approved` - Pagamento confirmado
- `charge.failed` - Pagamento falhou
- `charge.refunded` - Reembolsado
- `charge.expired` - Expirado

### Headers Esperados
A validação de webhook procura por:
- `X-Webhook-Signature` - HMAC-SHA256 do corpo bruto

---

## Testar a Integração

### 1. Verificar se o gateway está carregando
```bash
npm start
# Procure por: [GatewayFactory] ✓ Gateway registrado: zuckpay
```

### 2. Criar um PIX de teste
```bash
curl -X POST http://localhost:3000/api/pix \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "cpf": "12345678901",
    "phone": "11999999999",
    "amount": 67.70
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "transactionId": "charge_xxxxxxxx",
  "pixCode": "00020126...",
  "status": "pending",
  "amount": 67.70,
  "gateway": "zuckpay"
}
```

---

## Troubleshooting

### ❌ "PAYMENT_GATEWAY não configurado"
- Verifique se `PAYMENT_GATEWAY=zuckpay` está em `.env.local`
- Reinicie o servidor

### ❌ "GATEWAY_API_KEY não configurada"
- Verifique se a chave de API foi colada corretamente
- Não deve ter espaços em branco extras
- Certifique-se de que é a chave correta (não a Secret)

### ❌ "Erro HTTP 401" ou "Unauthorized"
- A API Key está errada ou expirada
- Verifique novamente no painel Zuckpay
- Regere as chaves se necessário

### ❌ Webhook não funciona
- Verifique se a URL está acessível publicamente
- Confirme que `GATEWAY_WEBHOOK_SECRET` está correto
- Teste com a ferramenta "Retry" ou "Test Webhook" do painel Zuckpay

---

## Estrutura do Gateway

O arquivo `functions/gateways/zuckpay.js` implementa:

```javascript
// Criar transação PIX
gateway.createPixTransaction({
  amount: 67.70,
  amountCents: 6770,
  customerName: "João Silva",
  customerEmail: "joao@teste.com",
  customerCpf: "12345678901",
  customerPhone: "11999999999",
  externalReference: "order_abc123"
});

// Consultar status
gateway.checkTransactionStatus("charge_xxxxx");

// Validar webhook
gateway.validateWebhook(event);

// Processar webhook
gateway.handleWebhook(event);
```

---

## Documentação Oficial
- Zuckpay Docs: https://developer.zuckpay.com.br/
- API Reference: https://api.zuckpay.com.br/docs
