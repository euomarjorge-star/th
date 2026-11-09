/**
 * Gateway Zuckpay (apenas PIX)
 *
 * Documentação oficial: https://www.zuckpay.com.br/conta/dev/
 *
 * Autenticação: HTTP Basic Auth com client_id (usuário) e client_secret
 * (senha) — NÃO é Bearer token com uma única chave.
 *
 * Criar cobrança PIX:
 *   POST /conta/v3/pix/qrcode
 *   Body: { valor, nome, cpf, email, telefone }  (valor em reais, decimal)
 *   Resposta: { transactionId, ... código PIX copia-e-cola + imagem do QR }
 */

const crypto = require("crypto");
const PaymentGateway = require("../lib/gateway");

class Zuckpay extends PaymentGateway {
  constructor(config = {}) {
    super(config);
    this.name = "zuckpay";
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.webhookSecret = config.webhookSecret;
    this.baseUrl = config.baseUrl || "https://www.zuckpay.com.br/conta";
    this.timeout = 15000; // 15 segundos
  }

  _authHeader() {
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    return `Basic ${basic}`;
  }

  /**
   * Cria uma transação PIX via Zuckpay
   */
  async createPixTransaction(params) {
    const {
      amount,
      customerName,
      customerEmail,
      customerCpf,
      customerPhone,
      productName,
    } = params;

    console.log(`[${this.name}] Criando transação PIX...`);
    console.log(`[${this.name}] Valor: R$ ${amount}`);
    console.log(`[${this.name}] Cliente: ${customerName} (${customerCpf})`);

    if (!this.clientId || !this.clientSecret) {
      throw new Error("❌ GATEWAY_CLIENT_ID / GATEWAY_API_KEY (client_secret) não configurados para Zuckpay");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const payload = {
        valor: amount,
        nome: customerName,
        cpf: customerCpf,
        email: customerEmail,
        telefone: customerPhone,
      };
      if (productName) payload.descricao = productName;

      console.log(`[${this.name}] Enviando requisição para Zuckpay...`);

      const response = await fetch(`${this.baseUrl}/v3/pix/qrcode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this._authHeader(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!response.ok) {
        const errorData = this._tryParseJson(responseText);
        const errorMessage =
          errorData?.error?.message ||
          errorData?.message ||
          responseText ||
          `HTTP ${response.status}`;

        console.error(`[${this.name}] Erro HTTP ${response.status}:`, errorMessage);
        throw new Error(`Zuckpay Error: ${errorMessage}`);
      }

      const data = this._tryParseJson(responseText);
      const charge = data?.data || data;

      const transactionId = charge.transactionId || charge.id;
      const pixCode = charge.pix_copy_paste || charge.brcode || charge.qrcode || charge.copia_e_cola;

      if (!transactionId || !pixCode) {
        console.error(`[${this.name}] Resposta inválida:`, data);
        throw new Error("Zuckpay retornou resposta incompleta (faltam transactionId ou código PIX)");
      }

      console.log(`[${this.name}] ✓ Cobrança criada com sucesso: ${transactionId}`);

      return {
        success: true,
        transactionId,
        pixCode,
        qrCodeBase64: charge.qr_code_image || charge.qrcode_image || null,
        status: this._mapStatus(charge.status),
        expiresAt: charge.expires_at || null,
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

    if (!this.clientId || !this.clientSecret) {
      throw new Error("❌ GATEWAY_CLIENT_ID / GATEWAY_API_KEY (client_secret) não configurados para Zuckpay");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/v3/pix/${transactionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": this._authHeader(),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!response.ok) {
        const errorData = this._tryParseJson(responseText);
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        console.error(`[${this.name}] Erro ao consultar status:`, errorMessage);
        throw new Error(`Zuckpay Error: ${errorMessage}`);
      }

      const data = this._tryParseJson(responseText);
      const charge = data?.data || data;

      if (!charge?.status) {
        throw new Error("Zuckpay retornou resposta inválida");
      }

      const status = this._mapStatus(charge.status);
      const paid = status === "paid";

      console.log(`[${this.name}] Status obtido: ${charge.status} → ${status}`);

      return {
        status,
        paid,
        rawResponse: charge,
      };
    } catch (err) {
      console.error(`[${this.name}] Erro ao consultar status:`, err.message);
      throw err;
    }
  }

  /**
   * Valida a autenticidade de um webhook do Zuckpay
   *
   * Header: X-ZuckPay-Signature: "t=<timestamp>,v1=<hmac_sha256_hex>"
   * Assinatura = HMAC-SHA256( `${t}.${rawBody}` , webhookSecret )
   */
  validateWebhook(event) {
    const sigHeader =
      event.headers["x-zuckpay-signature"] || event.headers["X-ZuckPay-Signature"];
    const body = event.body || "";

    if (!sigHeader || !this.webhookSecret) {
      console.warn(`[${this.name}] Webhook inválido: falta assinatura ou secret`);
      return false;
    }

    try {
      const parts = Object.fromEntries(
        sigHeader.split(",").map((p) => p.split("=").map((s) => s.trim()))
      );
      const ts = parts.t;
      const v1 = parts.v1;

      if (!ts || !v1) {
        console.warn(`[${this.name}] Assinatura em formato inesperado: ${sigHeader}`);
        return false;
      }

      // Anti-replay: rejeita assinaturas com mais de 5 minutos
      const ageSeconds = Math.abs(Date.now() / 1000 - Number(ts));
      if (ageSeconds > 300) {
        console.warn(`[${this.name}] Webhook expirado (${ageSeconds}s)`);
        return false;
      }

      const expected = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(`${ts}.${body}`, "utf8")
        .digest("hex");

      const isValid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));

      console.log(`[${this.name}] Validação de webhook: ${isValid ? "✓" : "✗"}`);
      return isValid;
    } catch (err) {
      console.error(`[${this.name}] Erro ao validar webhook:`, err.message);
      return false;
    }
  }

  /**
   * Processa um webhook de pagamento do Zuckpay
   */
  async handleWebhook(event) {
    const body = this._tryParseJson(event.body || "{}");

    console.log(`[${this.name}] Processando webhook: ${body.event}`);

    const chargeId = body.data?.id || body.data?.transactionId || body.id;
    const chargeStatus = body.data?.status || "unknown";
    const status = this._mapStatus(chargeStatus);

    if (!chargeId) {
      throw new Error("Webhook não contém transaction ID");
    }

    console.log(`[${this.name}] Webhook processado: ${chargeId} → ${status}`);

    return {
      success: true,
      transactionId: chargeId,
      status,
      event: body.event,
      rawData: body.data,
    };
  }

  // ========================
  // Métodos Auxiliares
  // ========================

  /**
   * Mapeia status do Zuckpay para formato padrão
   * Padrão: pending, paid, rejected, refunded
   */
  _mapStatus(rawStatus) {
    const status = (rawStatus || "").toLowerCase();

    if (status === "approved" || status === "paid" || status === "pago") return "paid";
    if (status === "pending" || status === "waiting_payment") return "pending";
    if (status === "failed" || status === "chargeback") return "rejected";
    if (status === "refunded") return "refunded";
    if (status === "cancelled" || status === "expired") return "rejected";

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

module.exports = Zuckpay;
