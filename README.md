# InvictusPay - Checkout PIX com Zuckpay

Plataforma de checkout com PIX integrado ao Zuckpay, rastreamento de funil e painel administrativo.

---

## 🚀 Quick Start

### Desenvolvimento Local
```bash
npm install
npm start
# Acesse http://localhost:3000
```

### Deploy em Produção
```bash
vercel --prod
# Veja docs/VERCEL_DEPLOY.md para detalhes
```

---

## 📊 O que é

- **Frontend:** React + Vite (tela de checkout)
- **Backend:** Express + APIs serverless
- **Payment:** Zuckpay (PIX)
- **Rastreamento:** UTMify + funil customizado
- **Database:** Supabase (opcional)
- **Hosting:** Vercel (servidor + APIs)

---

## 🎯 Fluxo Rápido

```
Usuário acessa checkout
    ↓
Preenche dados (nome, CPF, email, telefone)
    ↓
Clica "Pagar"
    ↓
Recebe QR Code PIX (Zuckpay)
    ↓
Paga via app bancário
    ↓
Webhook confirma pagamento
    ↓
Redireciona para página de sucesso
```

---

## 💰 Valores Configurados

- **Padrão:** R$ 67,70
- **Upsell:** R$ 81,50 (quando requisição tem valor entre R$ 70-90)

---

## 📚 Documentação

Vá para **[`docs/README.md`](./docs/README.md)** para:
- 📖 [Deploy no Vercel](./docs/VERCEL_DEPLOY.md)
- 💳 [Configuração Zuckpay](./docs/ZUCKPAY_SETUP.md)
- 🛒 [Checkout & Upsell](./docs/CHECKOUT_UPSELL.md)
- 🔗 [Painel Admin](./docs/CONECTAR-OFERTA-AO-PAINEL.md)

---

## 🔑 Credenciais

Todas em **`functions/credentials.js`** (hardcoded):

```javascript
PAYMENT_GATEWAY: "zuckpay"
GATEWAY_API_KEY: "093cb8a2c87aee32f5e746805726d6bce0e2a680ed54c67c2009d50afbfd93ac"
UTMIFY_TOKEN: "lzASZob4ldSJJc3jT1LILy9alPxWJgpnPhCh"
CPF_API_TOKEN: "4c80cd47-d9d5-4672-a301-b9b8741fc293"
```

---

## 🏗️ Arquitetura

### APIs Principais

| Path | Método | Função |
|------|--------|--------|
| `/api/pix` | POST | Cria PIX via Zuckpay |
| `/api/check-payment` | POST | Consulta status de pagamento |
| `/api/webhook/payment` | POST | Webhook do Zuckpay (confirma) |
| `/api/track/evento` | POST | Rastreia etapa do funil |
| `/api/track/lead` | POST | Rastreia dados do lead |

### Componentes Principais

```
functions/
├── pix.js                    ← Cria PIX (calcula valor)
├── check-payment.js          ← Consulta Zuckpay
├── gateways/zuckpay.js      ← Driver Zuckpay
├── credentials.js            ← Chaves centralizadas
└── lib/gateway-factory.js   ← Factory pattern
```

---

## 🧪 Testar Localmente

### Via Browser
1. Acesse http://localhost:3000
2. Preencha o formulário
3. Clique "Pagar"
4. Deverá aparecer o QR Code

### Via cURL
```bash
curl -X POST http://localhost:3000/api/pix \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "cpf": "12345678901",
    "phone": "11999999999"
  }'
```

---

## 📦 Estrutura

```
.
├── docs/                    📚 Documentação (LEIA PRIMEIRO)
├── functions/              🔧 Backend
│   ├── pix.js
│   ├── gateways/zuckpay.js
│   └── credentials.js
├── src/                    ⚛️ Frontend React
├── assets/                 📦 Static files
├── vercel.json            ⚙️ Vercel config
├── server.js              🚀 Express
└── package.json
```

---

## 🚢 Deploy

### Vercel (Recomendado)

1. **Faça login:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configure domínio:**
   - Dashboard Vercel → Settings → Domains
   - Atualize DNS no registrador

Veja [docs/VERCEL_DEPLOY.md](./docs/VERCEL_DEPLOY.md) para detalhes.

---

## ⚙️ Customização

### Mudar Valor do Checkout
Edite `functions/pix.js` linha 165:
```javascript
let amountReais = 99.99; // Novo valor padrão
```

### Mudar Valor do Upsell
Edite `functions/pix.js` linha 170:
```javascript
if (n >= 70 && n < 90) {
  amountReais = 99.99; // Novo upsell
}
```

### Mudar Gateway
Edite `functions/credentials.js`:
```javascript
PAYMENT_GATEWAY: "outro-gateway" // Implementar driver correspondente
```

---

## 🔍 Logs

### Desenvolvimento
```bash
npm start
# Procure por [PIX], [zuckpay], [Tracking]
```

### Produção (Vercel)
```bash
vercel logs --follow
```

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "Gateway not configured" | Verifique `PAYMENT_GATEWAY` em `credentials.js` |
| "API key not found" | Atualize `GATEWAY_API_KEY` em `credentials.js` |
| "Port 3000 already in use" | `pkill node && npm start` |
| "Build failed on Vercel" | Veja [VERCEL_DEPLOY.md](./docs/VERCEL_DEPLOY.md#-troubleshooting) |

---

## 📞 Recursos

- 📖 [Documentação Completa](./docs/README.md)
- 🚀 [Deploy Vercel](./docs/VERCEL_DEPLOY.md)
- 💳 [Zuckpay Setup](./docs/ZUCKPAY_SETUP.md)
- 🛒 [Checkout Guide](./docs/CHECKOUT_UPSELL.md)
- 🔗 [Painel Admin](./docs/CONECTAR-OFERTA-AO-PAINEL.md)

---

## 📝 Stack

- **Frontend:** React 19 + Vite
- **Backend:** Express.js
- **Payment:** Zuckpay (PIX)
- **Analytics:** UTMify
- **Database:** Supabase (opcional)
- **Hosting:** Vercel
- **Tracking:** Custom funil + localStorage

---

## 💡 Começar Agora

1. **Ler:** `docs/README.md`
2. **Testar:** `npm start` → http://localhost:3000
3. **Deploy:** `vercel --prod` (após ler [VERCEL_DEPLOY.md](./docs/VERCEL_DEPLOY.md))

---

**Última atualização:** 09 de Novembro de 2026  
**Status:** ✅ Funcional | Zuckpay + Vercel + Documentação Organizada
