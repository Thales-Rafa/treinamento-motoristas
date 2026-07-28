import { z } from "zod";
import { isValidCpf, onlyDigits } from "@/lib/validators/cpf";

export const driverInfoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo.")
    .max(120, "Nome muito longo.")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' ]+$/, "Use apenas letras e espaços."),
  matricula: z
    .string()
    .trim()
    .min(1, "Informe a matrícula.")
    .max(30, "Matrícula muito longa.")
    .regex(/^[A-Za-z0-9.-]+$/, "Matrícula inválida."),
  cpf: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((value) => value.length === 11, "CPF deve ter 11 dígitos.")
    .refine(isValidCpf, "CPF inválido."),
});

export type DriverInfoInput = z.infer<typeof driverInfoSchema>;
