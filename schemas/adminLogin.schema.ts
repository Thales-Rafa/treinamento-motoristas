import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
