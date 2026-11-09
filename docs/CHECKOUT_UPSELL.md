# Checkout & Upsell - Documentação Completa

## 🎯 Fluxo do Checkout Atual

```
Usuário preenche formulário
    ↓
/api/pix recebe os dados
    ↓
Calcula o valor (padrão R$ 67.70 ou R$ 81.50 se for upsell)
    ↓
Zuckpay cria a cobrança PIX
    ↓
Retorna BRCODE + QR Code para o usuário pagar
    ↓
Webhook confirma o pagamento
    ↓
Usuário redireciona para página de sucesso
```

---

## 💰 Valores Configurados

### Valor Padrão
- **R$ 67,70** - Oferta principal
- Campo: `amountReais = 67.70` em `functions/pix.js` linha 165

### Upsell
- **R$ 81,50** - Oferta adicional
- Acionado quando: valor requisitado está entre **R$ 70 e R$ 90**
- Lógica em `functions/pix.js` linhas 167-172:

```javascript
if (n >= 70 && n < 90) {
  amountReais = 81.50; // UPSELL
}
```

---

## 📝 Como o Checkout Funciona

### 1. Dados Enviados pelo Frontend

Quando o usuário clica em "Pagar", o frontend envia:

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "cpf": "12345678901",
  "phone": "11999999999",
  "amount": 67.70,
  "utm": {
    "utm_source": "google",
    "utm_campaign": "ads_janeiro"
  }
}
```

### 2. Processamento no Backend (/api/pix)

1. **Carrega o gateway** (agora Zuckpay)
2. **Calcula o valor** - Padrão R$ 67,70 ou R$ 81,50 se for upsell
3. **Gera/Valida CPF** - Se não tiver, gera um aleatório válido
4. **Cria transação** - Chama `gateway.createPixTransaction()`
5. **Notifica UTMify** - Rastreia o pagamento para análise
6. **Retorna PIX Code** - BRCODE para o usuário

### 3. Resposta Retornada

```json
{
  "success": true,
  "pixCode": "00020126...",
  "transaction_id": "charge_abc123",
  "transactionId": "charge_abc123",
  "status": "pending",
  "amount": 67.70,
  "gateway": "zuckpay"
}
```

---

## 🔄 Rastreamento do Funil (assets/tracking.js)

Antes mesmo de fazer o PIX, o checkout rastreia:

1. **Etapa alcançada** - "pix" (quando chega na tela de pagamento)
2. **Dados do usuário** - Nome, CPF, email, telefone (enviado para /api/track/lead)
3. **UTMs preservadas** - Qual anúncio o trouxe
4. **Sessão** - Um ID por aba (sessionStorage)
5. **Atribuição** - Primeira UTM é guardada (localStorage)

### Endpoints de Rastreamento

```
POST /api/track/evento        - Registra etapa alcançada
POST /api/track/lead          - Registra dados do lead
```

---

## 🧪 Testar o Checkout Localmente

### Opção 1: Via Browser (Recomendado)

1. Abra `http://localhost:3000`
2. Navegue até a tela de checkout/pagamento
3. Preencha os dados:
   - **Nome:** João Silva
   - **Email:** joao@teste.com
   - **CPF:** 12345678901
   - **Telefone:** 11999999999
4. Clique em "Pagar"
5. Deverá aparecer o QR Code do PIX

### Opção 2: Via cURL (Para testar API)

```bash
# Teste padrão (R$ 67.70)
curl -X POST http://localhost:3000/api/pix \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "cpf": "12345678901",
    "phone": "11999999999"
  }'

# Teste com UPSELL (R$ 81.50)
curl -X POST http://localhost:3000/api/pix \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "email": "maria@teste.com",
    "cpf": "98765432109",
    "phone": "21988888888",
    "amount": 75.00
  }'
```

### Resposta Esperada

```json
{
  "success": true,
  "pixCode": "00020126360014br.gov.bcb.brcode0136...",
  "transactionId": "charge_abc123xyz",
  "status": "pending",
  "amount": 67.70,
  "gateway": "zuckpay"
}
```

---

## ⚙️ Configuração do Zuckpay

### 1. Credenciais (já configuradas)

Arquivo: `.env.local`

```env
PAYMENT_GATEWAY=zuckpay
GATEWAY_API_KEY=093cb8a2c87aee32f5e746805726d6bce0e2a680ed54c67c2009d50afbfd93ac
GATEWAY_API_SECRET=
GATEWAY_WEBHOOK_SECRET=
```

### 2. Obter Webhook Secret

1. Acesse: https://dashboard.zuckpay.com.br
2. Vá em **Settings → Webhooks**
3. Copie o "Webhook Secret"
4. Atualize `.env.local`:

```env
GATEWAY_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

5. Reinicie o servidor: `npm start`

### 3. Registrar URL do Webhook

No painel Zuckpay:
- **URL:** `https://seu-dominio.com/api/webhook/payment`
- **Eventos:** charge.approved, charge.failed, charge.expired

---

## 🎨 Personalizar Valores

### Mudar Valor Padrão

Edite `functions/pix.js` linha 165:

```javascript
let amountReais = 87.50; // Novo valor padrão
```

### Mudar Valor do Upsell

Edite `functions/pix.js` linha 170:

```javascript
if (n >= 70 && n < 90) {
  amountReais = 99.90; // Novo valor upsell
}
```

### Ajustar Faixa do Upsell

Edite `functions/pix.js` linhas 167-172:

```javascript
const rawAmount = body.amount ?? body.valor ?? body.total;
if (rawAmount) {
  const n = Number(rawAmount);
  // Mudar a faixa (agora será 80-100 em vez de 70-90)
  if (n >= 80 && n < 100) {
    amountReais = 99.90;
  }
}
```

---

## 🔍 Debug - Logs do Servidor

Quando o servidor está rodando, procure pelos logs:

```
[GatewayFactory] ✓ Gateway registrado: zuckpay
[PIX] ===== FUNÇÃO INICIADA =====
[PIX] ✓ Gateway carregado: zuckpay
[PIX] Amount: 67.70 Cents: 6770
[PIX] Customer: { name: 'João Silva', email: 'joao@teste.com', cpf: '12345678901' }
[zuckpay] Criando transação PIX...
[zuckpay] ✓ Cobrança criada com sucesso: charge_abc123
[zuckpay] Status: pending
```

---

## ❌ Troubleshooting

### ❌ "Gateway not configured"

```
[PIX] Erro ao carregar gateway: Gateway '...' não encontrado
```

**Solução:**
- Verifique se `PAYMENT_GATEWAY=zuckpay` está em `.env.local`
- Reinicie o servidor

### ❌ "GATEWAY_API_KEY não configurada"

```
❌ [zuckpay] GATEWAY_API_KEY não configurada para Zuckpay
```

**Solução:**
- Atualize `GATEWAY_API_KEY` em `.env.local`
- Certifique-se de que não tem espaços extras
- Reinicie o servidor

### ❌ Erro HTTP 401/403

```
[zuckpay] Erro HTTP 401: Unauthorized
```

**Solução:**
- API Key está expirada ou incorreta
- Regere as chaves no painel Zuckpay
- Atualize `.env.local`

### ❌ Porta 3000 já em uso

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solução (Windows):**
```powershell
Get-Process node | Stop-Process -Force
npm start
```

**Solução (macOS/Linux):**
```bash
lsof -i :3000
kill -9 <PID>
npm start
```

---

## 📊 Fluxo Completo com Diagramas

### Fluxo do Checkout

```
┌─────────────────────────────────────────┐
│  Frontend (React) - Tela de Checkout    │
├─────────────────────────────────────────┤
│ Usuário preenche:                       │
│ - Nome, Email, CPF, Telefone            │
│ - Clica em "Pagar"                      │
└────────────────┬────────────────────────┘
                 │ POST /api/pix
                 │ (body: nome, email, cpf...)
                 ▼
┌─────────────────────────────────────────┐
│  Backend - /api/pix (functions/pix.js)  │
├─────────────────────────────────────────┤
│ 1. Parse body                           │
│ 2. Calcula valor (67.70 ou 81.50)       │
│ 3. Carrega gateway (Zuckpay)            │
│ 4. Cria transação no Zuckpay            │
│ 5. Notifica UTMify                      │
└────────────────┬────────────────────────┘
                 │ Response JSON
                 │ { pixCode, transactionId... }
                 ▼
┌─────────────────────────────────────────┐
│  Frontend - Exibe QR Code PIX           │
├─────────────────────────────────────────┤
│ Usuário lê o QR com o celular e paga    │
└────────────────┬────────────────────────┘
                 │ Webhook (Zuckpay)
                 │ POST /api/webhook/payment
                 ▼
┌─────────────────────────────────────────┐
│  Backend - Webhook Handler              │
├─────────────────────────────────────────┤
│ Valida assinatura                       │
│ Atualiza status da transação            │
│ Envia confirmação ao usuário            │
└────────────────┬────────────────────────┘
                 │ Redireciona para /success
                 ▼
┌─────────────────────────────────────────┐
│  Frontend - Tela de Sucesso             │
├─────────────────────────────────────────┤
│ "Pagamento recebido com sucesso!"       │
│ Oferece Upsell (se configurado)         │
└─────────────────────────────────────────┘
```

---

## 📚 Arquivos Relacionados

| Arquivo | Função |
|---------|--------|
| `functions/pix.js` | Cria PIX, calcula valor (67.70 ou 81.50) |
| `functions/gateways/zuckpay.js` | Integração com API Zuckpay |
| `functions/lib/gateway-factory.js` | Carrega o gateway configurado |
| `assets/tracking.js` | Rastreia funil antes do PIX |
| `.env.local` | Credenciais do Zuckpay |
| `functions/check-payment.js` | Consulta status de pagamento |
| `functions/notify-approved.js` | Notifica quando pagamento foi aprovado |

---

## 🚀 Resumo: O que Mudou

✅ Gateway trocado de GorillaPay para Zuckpay
✅ Arquivo `functions/gateways/zuckpay.js` criado
✅ `.env.local` atualizado com `PAYMENT_GATEWAY=zuckpay`
✅ API Key do Zuckpay adicionada: `093cb8a2c87aee32f5e746805726d6bce0e2a680ed54c67c2009d50afbfd93ac`
✅ Upsell de R$ 81.50 já está funcionando
⏳ Webhook Secret ainda precisa ser adicionado (obtenha no painel Zuckpay)

---

## 📞 Próximos Passos

1. **Teste o checkout:** Acesse http://localhost:3000 e faça um teste
2. **Obtenha Webhook Secret:** No painel Zuckpay → Settings → Webhooks
3. **Atualize `.env.local`:** Adicione `GATEWAY_WEBHOOK_SECRET=...`
4. **Configure Webhook URL:** No painel Zuckpay, registre a URL do seu domínio
5. **Teste o pagamento:** Faça um teste real ou simule no painel Zuckpay

Tudo pronto! 🎉
