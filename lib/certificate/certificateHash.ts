import "server-only";
import { createHash } from "crypto";

/**
 * Código curto derivado dos dados do registro + do segredo do servidor.
 * Não é uma assinatura digital com validade jurídica por si só, mas permite
 * detectar se um PDF foi alterado depois de emitido (o hash não vai bater
 * mais com os dados reais armazenados no banco).
 */
export function generateCertificateHash(training: {
  id: string;
  cpf: string;
  started_at: string;
  ended_at: string | null;
}): string {
  const secret = process.env.APP_TOKEN_SECRET ?? "";
  const raw = `${training.id}|${training.cpf}|${training.started_at}|${training.ended_at ?? ""}|${secret}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16).toUpperCase();
}
