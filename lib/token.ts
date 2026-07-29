import { createHmac, timingSafeEqual } from "crypto";

/**
 * Token de sessão de treinamento assinado com HMAC-SHA256.
 *
 * É emitido pelo servidor em /api/treinamento/start (nunca pelo cliente) e carrega
 * `iat`, o horário em que o servidor liberou o vídeo. Esse carimbo de tempo é a base
 * da checagem anti-fraude em /api/treinamento/confirm: como o cliente não consegue
 * forjar a assinatura sem o APP_TOKEN_SECRET, ele também não consegue "voltar no tempo"
 * para simular que assistiu ao vídeo mais rápido do que a duração real permite.
 */
export interface TrainingTokenPayload {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  iat: number;
}

const TOKEN_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 horas

function getSecret(): string {
  const secret = process.env.APP_TOKEN_SECRET;
  if (!secret) {
    throw new Error("APP_TOKEN_SECRET não configurado.");
  }
  return secret;
}

function base64UrlEncode(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

function sign(data: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(data);
  return base64UrlEncode(hmac.digest());
}

export function createTrainingToken(payload: Omit<TrainingTokenPayload, "iat">): string {
  const fullPayload: TrainingTokenPayload = { ...payload, iat: Date.now() };
  const payloadEncoded = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload), "utf8"));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export function verifyTrainingToken(token: string): TrainingTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadEncoded, signature] = parts;

  const expectedSignature = sign(payloadEncoded);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded).toString("utf8")) as TrainingTokenPayload;
    if (
      typeof payload.id !== "string" ||
      typeof payload.nome !== "string" ||
      typeof payload.matricula !== "string" ||
      typeof payload.cpf !== "string" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    if (Date.now() - payload.iat > TOKEN_MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}
