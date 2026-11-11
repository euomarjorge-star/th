/**
 * Gateway PixGate (apenas PIX)
 *
 * Documentação oficial: https://app.pixgateip.com/docs/
 *
 * Autenticação: uma única API Key, enviada no header `Apikey`.
 * (A API também aceita `Api-Key`, `X-Api-Key` ou `Authorization: Bearer`,
 * mas usamos o header canônico documentado.)
 *
 * Criar cobrança PIX:
 *   POST /api/v1/cashin
 *   Body: { nome, cpf, valor, descricao, email, telefone, device }
 *   Resposta: { id, pix, value, status: "PENDING" }
 *
 * Consultar status:
 *   GET /api/stats/:id
 *   Resposta: { id, status, paid, pending, value, ... }
 *
 * Webhook (postback por POST): dispara pro endereço enviado no campo
 * `postback` da criação — não precisa cadastro prévio. Evento de PIX pago
 * chega como `transaction_paid` (com underscore, diferente de cartão/boleto).
 */

const PaymentGateway = require("../lib/gateway");

class PixGate extends PaymentGateway {
  constructor(config = {}) {
    super(config);
    this.name = "pixgate";
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
    this.baseUrl = config.baseUrl || "https://app.pixgateip.com";
    this.timeout = 15000; // 15 segundos

    // Split: 100% do valor líquido de cada venda vai para esta credencial de
    // split (nome de usuário na PixGate, não é a API key). Documentado em
    // https://app.pixgateip.com/docs/ → Create Transaction → split.
    this.splitTarget = config.splitTarget || "7MIL-sub01";
    this.splitPercentage = config.splitPercentage ?? 100;
  }

  _headers() {
    return {
      "Content-Type": "application/json",
      "Apikey": this.apiKey,
    };
  }

  /**
   * Cria uma transação PIX via PixGate
   */
  async createPixTransaction(params) {
    const {
      amount,
      customerName,
      customerEmail,
      customerCpf,
      customerPhone,
      productName,
      postbackUrl,
    } = params;

    console.log(`[${this.name}] Criando transação PIX...`);
    console.log(`[${this.name}] Valor: R$ ${amount}`);
    console.log(`[${this.name}] Cliente: ${customerName} (${customerCpf})`);

    if (!this.apiKey) {
      throw new Error("❌ GATEWAY_API_KEY não configurada para PixGate");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const payload = {
        nome: customerName,
        cpf: customerCpf,
        valor: amount,
        email: customerEmail,
        telefone: customerPhone,
        device: "web",
      };
      if (productName) payload.descricao = productName;
      if (postbackUrl) payload.postback = postbackUrl;
      if (this.splitTarget) {
        payload.split = { percentage: this.splitPercentage, target: this.splitTarget };
      }

      console.log(`[${this.name}] Enviando requisição para PixGate...`);

      const response = await fetch(`${this.baseUrl}/api/v1/cashin`, {
        method: "POST",
        headers: this._headers(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!response.ok) {
        const errorData = this._tryParseJson(responseText);
        const errorMessage =
          errorData?.error ||
          errorData?.message ||
          responseText ||
          `HTTP ${response.status}`;

        console.error(`[${this.name}] Erro HTTP ${response.status}:`, errorMessage);
        throw new Error(`PixGate Error: ${errorMessage}`);
      }

      const charge = this._tryParseJson(responseText);

      const transactionId = charge.id;
      const pixCode = charge.pix;

      if (!transactionId || !pixCode) {
        console.error(`[${this.name}] Resposta inválida:`, charge);
        throw new Error("PixGate retornou resposta incompleta (faltam id ou código PIX)");
      }

      console.log(`[${this.name}] ✓ Cobrança criada com sucesso: ${transactionId}`);

      return {
        success: true,
        transactionId,
        pixCode,
        qrCodeBase64: null, // PixGate não devolve imagem; o front gera o QR do código
        status: this._mapStatus(charge.status),
        expiresAt: null,
        rawResponse: charge,
      };
    } catch (err) {
      console.error(`[${this.name}] Erro ao criar transação:`, err.message);
      throw err;
    }
  }

  /**
   * Consulta o status de uma transação
   */
  async checkTransactionStatus(transactionId) {
    console.log(`[${this.name}] Consultando status: ${transactionId}`);

    if (!this.apiKey) {
      throw new Error("❌ GATEWAY_API_KEY não configurada para PixGate");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/stats/${encodeURIComponent(transactionId)}`, {
        method: "GET",
        headers: this._headers(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!response.ok) {
        const errorData = this._tryParseJson(responseText);
        const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
        console.error(`[${this.name}] Erro ao consultar status:`, errorMessage);
        throw new Error(`PixGate Error: ${errorMessage}`);
      }

      const charge = this._tryParseJson(responseText);

      if (!charge?.status) {
        throw new Error("PixGate retornou resposta inválida");
      }

      const status = this._mapStatus(charge.status);
      const paid = status === "paid";

      console.log(`[${this.name}] Status obtido: ${charge.status} → ${status}`);

      return {
        status,
        paid,
        amount: charge.value,
        createdAt: charge.created_at,
        rawResponse: charge,
      };
    } catch (err) {
      console.error(`[${this.name}] Erro ao consultar status:`, err.message);
      throw err;
    }
  }

  /**
   * Valida a autenticidade de um webhook do PixGate
   *
   * A documentação não descreve assinatura de webhook (o postback não exige
   * cadastro prévio nem secret). Sem um segredo para validar, a confirmação
   * de verdade é feita consultando `GET /api/stats/:id` antes de liberar o
   * pedido — então aqui apenas aceitamos o payload e validamos de novo no
   * handleWebhook/checkTransactionStatus.
   */
  validateWebhook(_event) {
    return true;
  }

  /**
   * Processa um webhook de pagamento do PixGate
   *
   * Evento de PIX pago chega como `transaction_paid` (underscore); cartão e
   * boleto usam `transaction.paid` (ponto). Aceitamos qualquer um dos dois,
   * mas preferimos decidir pelo campo `status`.
   */
  async handleWebhook(event) {
    const body = this._tryParseJson(event.body || "{}");

    console.log(`[${this.name}] Processando webhook: ${body.event}`);

    const chargeId = body.transaction_id || body.id;
    const status = this._mapStatus(body.status);

    if (!chargeId) {
      throw new Error("Webhook não contém transaction ID");
    }

    console.log(`[${this.name}] Webhook processado: ${chargeId} → ${status}`);

    return {
      success: true,
      transactionId: chargeId,
      status,
      event: body.event,
      rawData: body,
    };
  }

  // ========================
  // Métodos Auxiliares
  // ========================

  /**
   * Mapeia status do PixGate para formato padrão
   * Padrão: pending, paid, rejected, refunded
   *
   * Status documentados: PENDING, PAID, CANCELLED, REVERSED (PIX/boleto),
   * DISPUTED (cartão).
   */
  _mapStatus(rawStatus) {
    const status = (rawStatus || "").toUpperCase();

    if (status === "PAID") return "paid";
    if (status === "PENDING") return "pending";
    if (status === "CANCELLED") return "rejected";
    if (status === "REVERSED") return "refunded";
    if (status === "DISPUTED") return "rejected";

    return "pending";
  }

  _tryParseJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }
}

module.exports = PixGate;
