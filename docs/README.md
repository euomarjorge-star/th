# 📚 Documentação - InvictusPay

Guias de configuração, deploy e troubleshooting do projeto.

---

## 📖 Índice de Documentos

### 🚀 **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** - Deploy em Produção
Como fazer deploy no Vercel em vez de Netlify. Inclui:
- Passo a passo do deploy
- Configuração de domínio
- Variáveis de ambiente
- Monitoramento de logs
- Troubleshooting

**Para:** Preparar produção no Vercel

---

### 💳 **[ZUCKPAY_SETUP.md](./ZUCKPAY_SETUP.md)** - Integração Zuckpay
Configuração completa do gateway Zuckpay. Inclui:
- Obtenção de credenciais
- Atualização de `.env.local`
- Configuração de webhooks
- Testes da integração
- Troubleshooting

**Para:** Configurar chaves do Zuckpay

---

### 🛒 **[CHECKOUT_UPSELL.md](./CHECKOUT_UPSELL.md)** - Checkout e Upsell
Documentação completa do fluxo de compra. Inclui:
- Fluxo do checkout
- Configuração de valores (padrão R$ 67.70, upsell R$ 81.50)
- Rastreamento de funil
- Testes locais
- Personalização de valores
- Troubleshooting

**Para:** Entender e customizar o checkout

---

### 🔗 **[CONECTAR-OFERTA-AO-PAINEL.md](./CONECTAR-OFERTA-AO-PAINEL.md)** - Integração com Painel
Como conectar ofertas do checkout ao painel administrativo. Inclui:
- Estrutura de pedidos
- Upsell/Downsell
- Integração com banco de dados
- Relatórios

**Para:** Gerenciar pedidos no painel admin

---

## 🎯 Fluxo Recomendado de Leitura

### 1️⃣ **Primeiro Deploy**
```
VERCEL_DEPLOY.md
    ↓
ZUCKPAY_SETUP.md (se ainda não tiver as chaves)
    ↓
Deploy no Vercel
```

### 2️⃣ **Entender o Checkout**
```
CHECKOUT_UPSELL.md
    ↓
Testar localmente em http://localhost:3000
    ↓
Customizar valores se necessário
```

### 3️⃣ **Usar o Painel Admin**
```
CONECTAR-OFERTA-AO-PAINEL.md
    ↓
Visualizar/gerenciar pedidos
```

---

## 🔑 Credenciais Atuais

Todas as chaves estão em **`functions/credentials.js`**:

```javascript
PAYMENT_GATEWAY: "zuckpay"
GATEWAY_API_KEY: "093cb8a2c87aee32f5e746805726d6bce0e2a680ed54c67c2009d50afbfd93ac"
UTMIFY_TOKEN: "lzASZob4ldSJJc3jT1LILy9alPxWJgpnPhCh"
CPF_API_TOKEN: "4c80cd47-d9d5-4672-a301-b9b8741fc293"
```

---

## 🏗️ Estrutura do Projeto

```
invictuspay-main/
├── docs/                          📚 Documentação (você está aqui)
│   ├── README.md
│   ├── VERCEL_DEPLOY.md
│   ├── ZUCKPAY_SETUP.md
│   ├── CHECKOUT_UPSELL.md
│   └── CONECTAR-OFERTA-AO-PAINEL.md
│
├── functions/                     🔧 Backend (APIs)
│   ├── pix.js                    ← Cria PIX
│   ├── check-payment.js          ← Consulta status
│   ├── credentials.js            ← Chaves (hardcoded)
│   ├── gateways/
│   │   └── zuckpay.js           ← Driver Zuckpay
│   └── lib/
│       └── gateway-factory.js   ← Carrega gateways
│
├── src/                           ⚛️ Frontend (React)
│   └── components/               ← Telas do checkout
│
├── assets/                        📦 Bundle gerado
├── dist/                          📦 Vite build output
│
├── vercel.json                    ⚙️ Configuração Vercel
├── vite.config.js                ⚙️ Configuração Vite
├── server.js                      🚀 Express server
└── package.json                   📋 Dependências
```

---

## 🚀 Comandos Principais

```bash
# Desenvolvimento local
npm start                    # Roda em http://localhost:3000

# Build para produção
npm run build               # Gera dist/

# Teste
npm test                    # Se tiver testes configurados

# Deploy
vercel --prod              # Deploy no Vercel
vercel logs --follow       # Ver logs em tempo real
```

---

## 📞 Recursos Rápidos

| Preciso de... | Vá para |
|---|---|
| Fazer deploy | [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) |
| Chaves do Zuckpay | [ZUCKPAY_SETUP.md](./ZUCKPAY_SETUP.md) |
| Entender checkout | [CHECKOUT_UPSELL.md](./CHECKOUT_UPSELL.md) |
| Gerenciar pedidos | [CONECTAR-OFERTA-AO-PAINEL.md](./CONECTAR-OFERTA-AO-PAINEL.md) |
| Testar localmente | [CHECKOUT_UPSELL.md](./CHECKOUT_UPSELL.md#-testar-o-checkout-localmente) |
| Customizar valores | [CHECKOUT_UPSELL.md](./CHECKOUT_UPSELL.md#-personalizar-valores) |

---

## ✅ Checklist de Configuração

- [x] Gateway trocado para Zuckpay
- [x] Chaves adicionadas em `functions/credentials.js`
- [x] `vercel.json` criado
- [ ] Deploy feito em Vercel
- [ ] Webhook Secret configurado (opcional)
- [ ] Domínio customizado (opcional)

---

## 💡 Dicas Importantes

1. **Chaves no código:** Estão em `functions/credentials.js` com fallback para `.env.local`
2. **Auto-deploy:** Vercel faz deploy automático quando faz `git push`
3. **Preview URLs:** Branches têm URLs próprias antes de merge
4. **Logs:** Use `vercel logs --follow` para debug em produção
5. **Rollback:** Pode voltar pra versão anterior no dashboard Vercel

---

## 🆘 Precisa de Ajuda?

1. **Erro no deploy?** → Verifique [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md#-troubleshooting)
2. **Checkout não funciona?** → Verifique [CHECKOUT_UPSELL.md](./CHECKOUT_UPSELL.md#-troubleshooting)
3. **Problema com Zuckpay?** → Verifique [ZUCKPAY_SETUP.md](./ZUCKPAY_SETUP.md#troubleshooting)

---

## 📅 Última atualização
**09 de Novembro de 2026** - Integração Zuckpay + Deploy Vercel + Reorganização de docs
