export type TreinamentoStatus = "em_andamento" | "concluido";

/**
 * Linha da tabela `treinamentos` no Supabase. Existe no máximo 1 linha por CPF:
 * ela é criada com status `em_andamento` assim que o motorista preenche o formulário
 * e atualizada para `concluido` quando ele realmente termina o vídeo e confirma.
 */
export interface Treinamento {
  id: string;
  nome: string;
  matricula: string;
  cpf: string;
  status: TreinamentoStatus;
  video_concluido: boolean;
  duracao_assistida: number;
  duracao_video: number;
  started_at: string;
  ended_at: string | null;
  tempo_total_pagina: number | null;
  ip: string | null;
  user_agent: string | null;
  sistema_operacional: string | null;
  navegador: string | null;
  created_at: string;
}

export interface StartTrainingResponse {
  token: string;
  startedAt: string;
  videoId: string;
  videoDurationSeconds: number;
}

export interface ConfirmTrainingResponse {
  id: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error: string;
}
