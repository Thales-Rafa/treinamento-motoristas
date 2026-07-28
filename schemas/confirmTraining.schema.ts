import { z } from "zod";

/**
 * Payload enviado pelo cliente ao confirmar a conclusão do treinamento.
 * `duracaoAssistida` e `tempoTotalPagina` são apenas sinais informativos —
 * a validação que realmente impede fraude é o tempo decorrido no servidor
 * (ver lib/token.ts e app/api/treinamento/confirm/route.ts).
 */
export const confirmTrainingSchema = z.object({
  token: z.string().min(1, "Sessão de treinamento inválida."),
  duracaoAssistida: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60, "Duração assistida inválida."),
  tempoTotalPagina: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60, "Tempo de página inválido."),
});

export type ConfirmTrainingInput = z.infer<typeof confirmTrainingSchema>;
