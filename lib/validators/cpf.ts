/**
 * Validação de CPF (Cadastro de Pessoa Física).
 * Implementa o algoritmo real de dígitos verificadores, não apenas regex de formato,
 * para dificultar o cadastro de CPFs inventados.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11) return false;
  // Sequências como "111.111.111-11" têm dígitos verificadores válidos matematicamente,
  // mas nunca são CPFs reais emitidos.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const calcCheckDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const firstCheck = calcCheckDigit(9);
  const secondCheck = calcCheckDigit(10);

  return firstCheck === digits[9] && secondCheck === digits[10];
}

export function formatCpf(value: string): string {
  const cpf = onlyDigits(value).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
