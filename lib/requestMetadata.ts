import "server-only";
import { UAParser } from "ua-parser-js";

/** Extrai o IP do cliente a partir dos headers da requisição (verdade do servidor). */
export function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

/** Extrai SO/navegador a partir do header User-Agent (verdade do servidor). */
export function getDeviceInfo(userAgent: string): {
  sistemaOperacional: string | null;
  navegador: string | null;
} {
  const { os, browser } = UAParser(userAgent);
  return {
    sistemaOperacional: os.name ? `${os.name} ${os.version ?? ""}`.trim() : null,
    navegador: browser.name ? `${browser.name} ${browser.version ?? ""}`.trim() : null,
  };
}
