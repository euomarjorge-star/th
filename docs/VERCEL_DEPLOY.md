# Deploy no Vercel - Guia Completo

## 📋 Pré-requisitos

- ✅ Conta no [Vercel](https://vercel.com) (grátis)
- ✅ Git configurado localmente
- ✅ Projeto commitado com as chaves no `credentials.js`
- ✅ Arquivo `vercel.json` criado

---

## 🚀 Passo a Passo

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Fazer Login no Vercel

```bash
vercel login
```

Vai abrir o navegador pedindo suas credenciais. Confirme e volte ao terminal.

### 3. Deploy Inicial

Dentro da pasta do projeto:

```bash
vercel --prod
```

**Respostas esperadas:**
```
? Set up and deploy "~/invictuspay-main"? [Y/n] Y
? Which scope do you want to deploy to? (seu nome/organização)
? Link to existing project? [y/N] N
? What's your project's name? invictuspay
? In which directory is your code located? [./] ./
? Auto-detect build settings? [Y/n] Y
```

Aguarde o deploy finalizar. Vercel dirá:
```
✓ Production: https://invictuspay-main.vercel.app
```

### 4. Configurar Variáveis de Ambiente (Opcional)

Se precisar sobrescrever as chaves no painel Vercel:

1. Vá em [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto `invictuspay`
3. Settings → Environment Variables
4. Adicione/atualize:
   - `PAYMENT_GATEWAY=zuckpay`
   - `GATEWAY_API_KEY=093cb8a2c87aee32f5e746805726d6bce0e2a680ed54c67c2009d50afbfd93ac`
   - `UTMIFY_TOKEN=...`
   - etc.

> **Nota:** Como as chaves já estão no `credentials.js`, isso é opcional.

---

## 🔗 Configurar Domínio

### No Vercel Dashboard:

1. Vá em **Settings → Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `checkout.invictuspay.com.br`)
4. Copie os nameservers do Vercel
5. Atualize os nameservers no seu registrador de domínio
6. Aguarde propagação (5-30 minutos)

---

## 🔄 Redeployar Após Mudanças

Sempre que fizer mudanças no código:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

O Vercel fará deploy automaticamente! 🎉

Ou manualmente:
```bash
vercel --prod
```

---

## 🧪 Testar o Checkout em Produção

Após o deploy:

```bash
curl -X POST https://seu-dominio.com/api/pix \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com",
    "cpf": "12345678901",
    "phone": "11999999999"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "pixCode": "00020126...",
  "transactionId": "charge_xyz",
  "gateway": "zuckpay"
}
```

---

## 🔐 Configurar Webhook no Zuckpay

Agora que o projeto está em produção:

1. Acesse o painel Zuckpay
2. Vá em **Settings → Webhooks**
3. Adicione URL:
   ```
   https://seu-dominio.com/api/webhook/payment
   ```
4. Selecione eventos:
   - `charge.approved`
   - `charge.failed`
   - `charge.expired`
5. Copie o **Webhook Secret**
6. No painel Vercel, adicione variável:
   ```
   GATEWAY_WEBHOOK_SECRET=seu_webhook_secret
   ```
7. Redeploy: `vercel --prod`

---

## 📊 Monitorar Projeto

### Logs em Tempo Real

```bash
vercel logs --follow
```

### Dashboard Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione `invictuspay`
3. Abas:
   - **Deployments** - Histórico de deploys
   - **Analytics** - Tráfego e performance
   - **Logs** - Erros e eventos

---

## ❌ Troubleshooting

### ❌ "Build failed"

```
Error: Command "npm run build" failed
```

**Solução:**
```bash
npm run build  # Testar localmente
git push       # Push para Vercel tentar novamente
```

### ❌ "Function compiled with errors"

```
ReferenceError: require is not defined
```

**Solução:**
- Certifique-se de que `functions/credentials.js` existe
- Verifique sintaxe do `server.js`
- Redeploy: `vercel --prod`

### ❌ "API retorna 404"

```
Cannot POST /api/pix
```

**Solução:**
- URL do domínio está correta?
- Deploy foi bem-sucedido?
- Check logs: `vercel logs --follow`

### ❌ "Timeout na requisição"

```
504 Gateway Timeout
```

**Solução:**
- Aumentar timeout em `vercel.json` → `maxDuration`
- Check se Zuckpay está respondendo

---

## 📁 Estrutura para Vercel

```
invictuspay-main/
├── vercel.json              ✅ Criado
├── server.js                ✅ Express rodando
├── package.json             ✅ Dependencies
├── dist/                    📦 Build output (gerado)
├── functions/
│   ├── pix.js              ✅ POST /api/pix
│   ├── check-payment.js    ✅ POST /api/check-payment
│   ├── credentials.js      ✅ Chaves hardcoded
│   ├── gateways/
│   │   └── zuckpay.js      ✅ Integração Zuckpay
│   └── lib/
│       └── gateway-factory.js
└── assets/                  📦 Frontend build
```

---

## 🎯 Checklist Final

- [ ] `vercel.json` criado
- [ ] Chaves em `functions/credentials.js`
- [ ] Deploy feito: `vercel --prod`
- [ ] Domínio configurado (opcional)
- [ ] Webhook URL registrado no Zuckpay
- [ ] Webhook Secret configurado no Vercel (opcional)
- [ ] Teste de checkout funcionando
- [ ] Logs monitorados

---

## 💡 Dicas

1. **Auto-deploy:** Cada push para main = deploy automático
2. **Rollback:** Se algo quebrar, Vercel permite voltar pra versão anterior
3. **Preview:** Branches têm URLs próprias antes de ir para main
4. **Performance:** Vercel otimiza automaticamente, sem configuração
5. **CORS:** Já está configurado em `vercel.json`

---

## 📞 Comandos Úteis

```bash
# Status do projeto
vercel status

# Ver logs em tempo real
vercel logs --follow

# Testar build localmente
npm run build

# Deploy direto (sem prompt)
vercel --prod --confirm

# Ver URL de produção
vercel inspect
```

---

## ✨ Pronto!

Seu projeto está em produção no Vercel! 🚀

**URL de Produção:** https://invictuspay-main.vercel.app

(ou seu domínio customizado após configurar DNS)

Qualquer dúvida, rode: `vercel help`
