import { z } from "zod";
import { isValidCpf, onlyDigits } from "@/lib/validators/cpf";

export const driverInfoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo.")
    .max(120, "Nome muito longo.")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ']+(\s[A-Za-zÀ-ÖØ-öø-ÿ']+)+$/, "Informe nome e sobrenome, só com letras.")
    .refine((value) => value.split(" ").every((word) => word.length >= 2), "Cada nome deve ter pelo menos 2 letras."),
  matricula: z
    .string()
    .trim()
    .min(1, "Informe a matrícula.")
    .max(20, "Matrícula muito longa.")
    .regex(/^\d+$/, "Matrícula deve conter apenas números."),
  cpf: z
    .string()
    .trim()
    .transform(onlyDigits)
    .refine((value) => value.length === 11, "CPF deve ter 11 dígitos.")
    .refine(isValidCpf, "CPF inválido."),
});

export type DriverInfoInput = z.infer<typeof driverInfoSchema>;
