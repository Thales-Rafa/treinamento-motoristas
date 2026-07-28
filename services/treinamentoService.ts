import type { DriverInfoInput } from "@/schemas/driverInfo.schema";
import type {
  ApiErrorResponse,
  ConfirmTrainingResponse,
  StartTrainingResponse,
} from "@/types/treinamento";

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiErrorResponse;
  if (!response.ok) {
    const message = (data as ApiErrorResponse).error ?? "Erro inesperado. Tente novamente.";
    throw new Error(message);
  }
  return data as T;
}

export async function startTraining(input: DriverInfoInput): Promise<StartTrainingResponse> {
  const response = await fetch("/api/treinamento/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<StartTrainingResponse>(response);
}

export async function confirmTraining(input: {
  token: string;
  duracaoAssistida: number;
  tempoTotalPagina: number;
}): Promise<ConfirmTrainingResponse> {
  const response = await fetch("/api/treinamento/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJsonOrThrow<ConfirmTrainingResponse>(response);
}
